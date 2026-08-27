// Scans for form elements and tags them
console.log("FormBharo: Content script loaded");

const tagFormElements = () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((el, index) => {
        el.dataset.formbharoId = `field-${index}`;
        el.style.border = "2px solid #4CAF50"; // Visual indicator
    });
};

tagFormElements();

// Listen for auto-fill messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fillField') {
        const el = document.querySelector(`[data-formbharo-id="${request.fieldId}"]`);
        if (el) {
            el.value = request.value;
            sendResponse({ status: 'success' });
        } else {
            sendResponse({ status: 'error', message: 'Field not found' });
        }
    }
});
