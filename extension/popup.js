let currentSessionId = null;

const BACKEND_URL = 'http://localhost:3000';

document.getElementById('fileUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    currentSessionId = data.sessionId;
    
    // Auto trigger extraction
    const extractRes = await fetch(`${BACKEND_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
    });
    const result = await extractRes.json();
    document.getElementById('chatArea').innerText = 'Data extracted: ' + JSON.stringify(result.data);
});

document.getElementById('sendBtn').addEventListener('click', async () => {
    const msg = document.getElementById('userInput').value;
    if (!currentSessionId) return;

    const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, message: msg })
    });
    const data = await res.json();
    document.getElementById('chatArea').innerText += `\nClaude: ${data.response}`;
});

