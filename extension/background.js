chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // If request is from popup to scan the page, forward to active tab
    if (request.type === 'SCAN_FORM') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_FORM_FIELDS' }, (response) => {
                sendResponse(response);
            });
        });
        return true; // Keep channel open for async response
    }
    
    // If request is to fill a field, forward to content script
    if (request.type === 'FILL_FIELD') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'FILL_FIELD', fieldId: request.fieldId, value: request.value }, (response) => {
                sendResponse(response);
            });
        });
        return true;
    }
});
