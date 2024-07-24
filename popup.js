let addressBook = {};

chrome.storage.sync.get('addressBook', (data) => {
  if (data.addressBook) {
    addressBook = data.addressBook;
    displayEntries();
  }
});

document.getElementById('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const address = document.getElementById('address').value;
  const name = document.getElementById('name').value;
  const memo = document.getElementById('memo').value;

  if (address && name) {
    addressBook[address] = { name, memo };
    saveAddressBook();
    clearForm();
  }
});

function saveAddressBook() {
  chrome.storage.sync.set({ addressBook: addressBook }, () => {
    displayEntries();
    updateContentScript();
  });
}

function updateContentScript() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'updateAddressBook', addressBook: addressBook });
    }
  });
}

function clearForm() {
  document.getElementById('address').value = '';
  document.getElementById('name').value = '';
  document.getElementById('memo').value = '';
}

function displayEntries() {
  const entriesDiv = document.getElementById('entries');
  entriesDiv.innerHTML = '';

  if (Object.keys(addressBook).length === 0) {
    entriesDiv.innerHTML = '<p class="text-gray-500 text-center">No addresses added yet.</p>';
  } else {
    for (const [address, data] of Object.entries(addressBook)) {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'bg-gray-50 p-4 rounded-md mb-2';
      entryDiv.innerHTML = `
        <div class="flex justify-between items-center mb-2">
        <div>
        <span class="font-semibold">${data.name}</span>
        <a href="https://klaytnscope.com/account/${address}" target="_blank" class="text-blue-500 text-sm">
        <img src="/images/external-link.svg" class="w-4 h-4 inline-block" />
        </div>
        </a>
          <div>
            <button class="text-blue-500 mr-2 edit-btn" data-address="${address}">Edit</button>
            <button class="text-red-500 delete-btn" data-address="${address}">Delete</button>
          </div>
        </div>
        <div class="text-sm text-gray-600 break-all">${address}</div>
        ${data.memo ? `<div class="text-sm text-gray-500 mt-2">${data.memo}</div>` : ''}
      `;
      entriesDiv.appendChild(entryDiv);
    }
  }

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', editEntry);
  });
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', deleteEntry);
  });
}

function editEntry(e) {
  const address = e.target.dataset.address;
  const data = addressBook[address];
  document.getElementById('address').value = address;
  document.getElementById('name').value = data.name;
  document.getElementById('memo').value = data.memo || '';
}

function deleteEntry(e) {
  const address = e.target.dataset.address;
  delete addressBook[address];
  saveAddressBook();
}
