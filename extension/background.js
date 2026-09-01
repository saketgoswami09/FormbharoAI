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

    // Auto fill page
    if (request.type === 'AUTO_FILL_PAGE') {
        (async () => {
            try {
                // 1. Scan page
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                const detectedFields = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_FORM_FIELDS' }, resolve);
                });
                
                if (!detectedFields || detectedFields.length === 0) {
                    return sendResponse({ error: 'No fields detected on page' });
                }
                
                // 2. Fetch mapping from backend
                const authRes = await chrome.storage.local.get(['authToken']);
                const token = authRes.authToken;
                
                const mapRes = await fetch('http://localhost:3000/api/mapFields', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        detectedFields,
                        dataCardId: request.dataCardId
                    })
                });
                
                const mapData = await mapRes.json();
                if (!mapRes.ok) throw new Error(mapData.error || 'Failed to map fields');
                
                // 3. Filter matched mappings and fetch the actual values from the datacard
                const datacardRes = await fetch(`http://localhost:3000/api/datacards/${request.dataCardId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dc = await datacardRes.json();
                
                const getNestedValue = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
                
                const mappingsToApply = [];
                for (const m of mapData.mapping) {
                    if (m.matchedKey) {
                        const val = getNestedValue(dc.data || {}, m.matchedKey);
                        if (val !== null && val !== undefined) {
                            mappingsToApply.push({
                                fieldId: m.fieldId,
                                value: String(Array.isArray(val) ? val.join(', ') : val),
                                confidence: m.confidence
                            });
                        }
                    }
                }
                
                // 4. Fill fields
                const fillRes = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'FILL_ALL', mappings: mappingsToApply }, resolve);
                });
                
                // 5. Summary
                const totalMapped = mappingsToApply.length;
                const filled = fillRes.results.filter(r => r.success).length;
                const needsReview = mapData.mapping.filter(m => m.matchedKey && m.confidence !== 'high').length;
                const unmatched = detectedFields.length - totalMapped;
                
                sendResponse({ filled, needsReview, unmatched });
            } catch (err) {
                sendResponse({ error: err.message });
            }
        })();
        return true;
    }
});
