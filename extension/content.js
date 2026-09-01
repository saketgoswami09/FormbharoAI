chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_FORM_FIELDS') {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(el => {
                // Skip hidden, submit, and button inputs
                const skipTypes = ['hidden', 'submit', 'button', 'reset', 'image'];
                return !skipTypes.includes(el.type);
            })
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
        
        // Tag them with data attributes
        const allInputs = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(el => {
                const skipTypes = ['hidden', 'submit', 'button', 'reset', 'image'];
                return !skipTypes.includes(el.type);
            });
        allInputs.forEach((el, index) => {
            el.dataset.formbharoId = `field-${index}`;
        });
        
        sendResponse(inputs);
        return true;
    }
    
    const fillElement = (el, value) => {
        if (!el) return false;
        
        // HARD RULE: Do not automate final submission / declarations
        if (el.type === 'checkbox') {
            const labelText = (document.querySelector(`label[for="${el.id}"]`)?.innerText || el.nextElementSibling?.innerText || el.parentElement?.innerText || '').toLowerCase();
            const declarationKeywords = ['acknowledge', 'declare', 'agree', 'terms and conditions'];
            if (declarationKeywords.some(keyword => labelText.includes(keyword))) {
                console.log('Skipping declaration checkbox intentionally:', labelText);
                return false;
            }
        }
        
        // Handle Radios
        if (el.type === 'radio') {
            const groupName = el.name;
            if (groupName) {
                const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${groupName}"]`));
                const targetValueStr = String(value).toLowerCase();
                for (let r of radios) {
                    const rLabel = (document.querySelector(`label[for="${r.id}"]`)?.innerText || r.nextElementSibling?.innerText || r.parentElement?.innerText || '').toLowerCase();
                    if (rLabel.includes(targetValueStr) || r.value.toLowerCase() === targetValueStr) {
                        r.click();
                        return true;
                    }
                }
            }
            return false;
        }

        // Handle Checkboxes
        if (el.type === 'checkbox') {
            const isTruthy = ['yes', 'true', '1', 'checked'].includes(String(value).toLowerCase());
            if (el.checked !== isTruthy) {
                el.click();
            }
            return true;
        }

        // Handle Select/Text/Textarea
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype, 'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, value);
        } else {
            el.value = value;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        
        return true;
    };

    if (request.type === 'FILL_FIELD') {
        const el = document.querySelector(`[data-formbharo-id="${request.fieldId}"]`);
        const success = fillElement(el, request.value);
        if (success && el) {
            el.style.outline = "2px solid #4CAF50";
            el.style.outlineOffset = "1px";
        }
        sendResponse({ success });
        return true;
    }

    if (request.type === 'FILL_ALL') {
        const results = [];
        for (const mapping of request.mappings) {
            const el = document.querySelector(`[data-formbharo-id="${mapping.fieldId}"]`);
            const success = fillElement(el, mapping.value);
            if (success && el) {
                el.style.outline = mapping.confidence === 'high' ? "2px solid #4CAF50" : "2px solid #FFC107";
                el.style.outlineOffset = "1px";
            }
            results.push({ fieldId: mapping.fieldId, success });
        }
        sendResponse({ results });
        return true;
    }
});
