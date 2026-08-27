chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_FORM_FIELDS') {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
            .map((el, index) => {
                const label = document.querySelector(`label[for="${el.id}"]`)?.innerText || el.placeholder || el.name || `Field ${index}`;
                return {
                    id: `field-${index}`,
                    name: el.name || el.id,
                    type: el.type,
                    label,
                    placeholder: el.placeholder
                };
            });
        
        // Tag them
        document.querySelectorAll('input, select, textarea').forEach((el, index) => {
            el.dataset.formbharoId = `field-${index}`;
            el.style.border = "2px solid #4CAF50";
        });
        
        sendResponse(inputs);
    }
    
    if (request.type === 'FILL_FIELD') {
        const el = document.querySelector(`[data-formbharo-id="${request.fieldId}"]`);
        if (el) {
            el.value = request.value;
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false });
        }
    }
});
