let currentSessionId = null;
let extractedData = null;

// Scan the form when popup opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ type: 'SCAN_FORM' }, (fields) => {
        const list = document.getElementById('formFields');
        list.innerHTML = fields.map(f => `
            <div>
                <label>${f.label}</label>
                <select id="map-${f.id}">
                    <option value="">-- Select Data --</option>
                    ${Object.keys(extractedData || {}).map(k => `<option value="${k}">${k}</option>`).join('')}
                </select>
                <button onclick="fillField('${f.id}')">Fill</button>
            </div>
        `).join('');
    });
});

async function fillField(fieldId) {
    const key = document.getElementById(`map-${fieldId}`).value;
    if (!key || !extractedData[key]) return;
    
    chrome.runtime.sendMessage({ 
        type: 'FILL_FIELD', 
        fieldId, 
        value: extractedData[key] 
    });
}
window.fillField = fillField; // Expose to global scope for onclick

// File upload logic
document.getElementById('fileUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    currentSessionId = data.sessionId;
    
    const extractRes = await fetch('http://localhost:3000/api/extract', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
    });
    const result = await extractRes.json();
    extractedData = result.data;
    document.getElementById('chatArea').innerText = 'Data extracted! Now map fields below.';
});

