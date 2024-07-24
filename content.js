let addressBook = {};

chrome.storage.sync.get('addressBook', (data) => {
  if (data.addressBook) {
    addressBook = data.addressBook;
    replaceAddresses();
    addAddressBookButton();
  }
});

// message listener 추가
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // updateAddressBook 이벤트가 발생하면 addressBook을 업데이트하고 replaceAddresses 함수를 실행
  if (request.action === 'updateAddressBook') {
    addressBook = request.addressBook;
    replaceAddresses();
  }
});

function replaceAddresses() {
  const excludeSelector =
    '#root > div > div.SidebarTemplate > div.SidebarTemplate__main > div > div > div.AccountPage__account > span';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement.closest(excludeSelector)) {
      // 기존의 주소 변경 로직
      let text = node.nodeValue;
      let modified = false;

      for (const [address, data] of Object.entries(addressBook)) {
        if (text.toLowerCase() === address.toLowerCase() && isValidEVMAddress(address)) {
          text = data?.name;
          modified = true;
        }
      }

      if (modified) {
        const span = document.createElement('span');
        span.innerHTML = text;
        node.parentNode.replaceChild(span, node);
      }
    }
  }
}
// TODO : 주소가 유효한 EVM 주소인지 확인하는 함수
function isValidEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function addAddressBookButton() {
  const targetElement = document.querySelector(
    '#root > div > div.SidebarTemplate > div.SidebarTemplate__main > div > div > div.AccountPage__header > h2'
  );
  if (targetElement) {
    const container = document.createElement('div');
    container.style.cssText = 'display: inline-block; margin-left: 10px; vertical-align: middle; height:3.5rem';
    container.innerHTML = `
         <button id="registerAddressBtn" style="height:100%; background-color: #4F46E5; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center;">
        <img src="${chrome.runtime.getURL('favicon.ico')}" style="width: 16px; height: 16px; margin-right: 5px;">
        주소 등록하기
      </button>
    `;

    targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
    document.getElementById('registerAddressBtn').addEventListener('click', showAddressInput);
  }
}

function showAddressInput() {
  const container = document.getElementById('registerAddressBtn').parentNode;
  container.innerHTML = `
    <input type="text" id="nameInput" placeholder="이름" style="margin-right: 5px; padding: 5px;">
    <button id="confirmAddressBtn" style="background-color: #4F46E5; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">등록</button>
    <button id="cancelAddressBtn" style="background-color: #9CA3AF; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer;">취소</button>
  `;

  document.getElementById('confirmAddressBtn').addEventListener('click', addNewAddress);
  document.getElementById('cancelAddressBtn').addEventListener('click', resetAddressButton);
}

function addNewAddress() {
  const name = document.getElementById('nameInput').value;
  const address = extractAddressFromURL();

  if (name && address) {
    addressBook[address] = { name, memo: '' };
    chrome.storage.sync.set({ addressBook: addressBook }, () => {
      replaceAddresses();
      resetAddressButton();
    });
  } else {
    alert('유효한 이름을 입력해주세요.');
  }
}

function resetAddressButton() {
  const container = document.getElementById('nameInput').parentNode;
  container.innerHTML = `
    <button id="registerAddressBtn" style="background-color: #4F46E5; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center;">
      <img src="${chrome.runtime.getURL('favicon.ico')}" style="width: 16px; height: 16px; margin-right: 5px;">
      주소 등록하기
    </button>
  `;
  document.getElementById('registerAddressBtn').addEventListener('click', showAddressInput);
}

function extractAddressFromURL() {
  const match = window.location.href.match(/\/account\/(0x[a-fA-F0-9]{40})/);
  return match ? match[1] : null;
}

// 첫 페이지 로드 시 주소 변경
replaceAddresses();

// MutationObserver를 사용하여 동적으로 변경되는 주소에 대해서도 변경
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      replaceAddresses();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
