const API_BASE = 'http://localhost:3000';

// ===== State =====
let authToken = null;
let currentSessionId = null;
let extractedData = null;
let selectedCardData = null;
let detectedFields = [];

// ===== DOM refs =====
const $ = (id) => document.getElementById(id);

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check for stored auth
    const stored = await chrome.storage.local.get(['authToken', 'userEmail']);
    if (stored.authToken) {
        authToken = stored.authToken;
        showApp(stored.userEmail);
    }

    // Auth toggle tabs
    $('showLogin').addEventListener('click', () => {
        $('loginForm').style.display = 'block';
        $('registerForm').style.display = 'none';
        $('showLogin').classList.add('active');
        $('showRegister').classList.remove('active');
        $('authError').textContent = '';
    });

    $('showRegister').addEventListener('click', () => {
        $('loginForm').style.display = 'none';
        $('registerForm').style.display = 'block';
        $('showRegister').classList.add('active');
        $('showLogin').classList.remove('active');
        $('authError').textContent = '';
    });

    // Auth actions
    $('loginBtn').addEventListener('click', handleLogin);
    $('regBtn').addEventListener('click', handleRegister);
    $('logoutBtn').addEventListener('click', handleLogout);

    // File upload
    $('fileUpload').addEventListener('change', handleFileSelect);
    $('extractBtn').addEventListener('click', handleExtract);

    // DataCards
    $('refreshCards').addEventListener('click', loadDataCards);
    $('saveCardBtn').addEventListener('click', handleSaveCard);

    // Form actions
    $('autoFillPageBtn').addEventListener('click', handleAutoFillPage);

    // Chat
    $('chatSendBtn').addEventListener('click', handleChatSend);
    $('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // Enter key for login/register
    $('loginPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    $('regPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
});

// ===== Auth =====
async function handleLogin() {
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if (!email || !password) {
        $('authError').textContent = 'Please fill in all fields';
        return;
    }

    try {
        $('loginBtn').disabled = true;
        $('loginBtn').textContent = 'Logging in...';
        const res = await apiFetch('/api/auth/login', 'POST', { email, password }, false);
        authToken = res.token;
        await chrome.storage.local.set({ authToken: res.token, userEmail: res.email });
        showApp(res.email);
    } catch (err) {
        $('authError').textContent = err.message;
    } finally {
        $('loginBtn').disabled = false;
        $('loginBtn').textContent = 'Login';
    }
}

async function handleRegister() {
    const email = $('regEmail').value.trim();
    const password = $('regPassword').value;
    if (!email || !password) {
        $('authError').textContent = 'Please fill in all fields';
        return;
    }
    if (password.length < 6) {
        $('authError').textContent = 'Password must be at least 6 characters';
        return;
    }

    try {
        $('regBtn').disabled = true;
        $('regBtn').textContent = 'Creating account...';
        const res = await apiFetch('/api/auth/register', 'POST', { email, password }, false);
        authToken = res.token;
        await chrome.storage.local.set({ authToken: res.token, userEmail: res.email });
        showApp(res.email);
    } catch (err) {
        $('authError').textContent = err.message;
    } finally {
        $('regBtn').disabled = false;
        $('regBtn').textContent = 'Register';
    }
}

async function handleLogout() {
    authToken = null;
    currentSessionId = null;
    extractedData = null;
    selectedCardData = null;
    detectedFields = [];
    await chrome.storage.local.remove(['authToken', 'userEmail']);
    $('authSection').style.display = 'block';
    $('appSection').style.display = 'none';
    $('authError').textContent = '';
}

function showApp(email) {
    $('authSection').style.display = 'none';
    $('appSection').style.display = 'block';
    $('userEmail').textContent = email || '';
    loadDataCards();
}

// ===== File Upload & Extraction =====
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        $('extractBtn').disabled = false;
        setStatus('File selected: ' + e.target.files[0].name, 'info');
    }
}

async function handleExtract() {
    const fileInput = $('fileUpload');
    const file = fileInput.files[0];
    if (!file) return;

    try {
        $('extractBtn').disabled = true;
        $('extractBtn').textContent = 'Uploading...';
        setStatus('<span class="spinner"></span> Uploading document...', 'info');

        // Step 1: Upload
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || 'Upload failed');
        }
        const uploadData = await uploadRes.json();
        currentSessionId = uploadData.sessionId;

        // Step 2: Extract
        $('extractBtn').textContent = 'Extracting...';
        setStatus('<span class="spinner"></span> AI is analyzing your document...', 'info');

        const profileType = $('profileType').value;
        const extractRes = await apiFetch('/api/extract', 'POST', {
            sessionId: currentSessionId,
            profileType
        });

        extractedData = extractRes.data;
        showExtractedData(extractedData);
        setStatus('✅ Data extracted successfully!', 'success');

        // Re-render form field mappings if we already scanned
        if (detectedFields.length > 0) {
            renderFormFields();
        }
    } catch (err) {
        setStatus('❌ ' + err.message, 'error');
    } finally {
        $('extractBtn').disabled = false;
        $('extractBtn').textContent = 'Extract Data';
    }
}

function showExtractedData(data) {
    $('dataPreview').style.display = 'block';
    $('dataContent').textContent = JSON.stringify(data, null, 2);
}

// ===== DataCards =====
async function handleSaveCard() {
    const name = $('cardName').value.trim();
    if (!name) {
        setStatus('❌ Please enter a name for the DataCard', 'error');
        return;
    }

    const dataToSave = extractedData || selectedCardData;
    if (!dataToSave) {
        setStatus('❌ No data to save. Extract or select data first.', 'error');
        return;
    }

    try {
        $('saveCardBtn').disabled = true;
        $('saveCardBtn').textContent = 'Saving...';
        const profileType = $('profileType').value;
        await apiFetch('/api/datacards', 'POST', {
            name,
            type: profileType,
            data: dataToSave
        });
        setStatus('✅ DataCard saved!', 'success');
        $('cardName').value = '';
        loadDataCards();
    } catch (err) {
        setStatus('❌ ' + err.message, 'error');
    } finally {
        $('saveCardBtn').disabled = false;
        $('saveCardBtn').textContent = 'Save as DataCard';
    }
}

async function loadDataCards() {
    try {
        const cards = await apiFetch('/api/datacards', 'GET');
        const container = $('cardsList');

        if (!cards.length) {
            container.innerHTML = '<p style="color:#7878a0;font-size:11px;padding:6px;">No saved DataCards yet.</p>';
            return;
        }

        container.innerHTML = cards.map(card => `
            <div class="card-item" data-id="${card._id}">
                <div>
                    <span class="card-name">${escapeHtml(card.name)}</span>
                    <span class="card-type">${card.type}</span>
                </div>
                <div class="card-actions">
                    <button class="del-btn" data-id="${card._id}" title="Delete">✕</button>
                </div>
            </div>
        `).join('');

        // Click to select a card (loads its data for autofill)
        container.querySelectorAll('.card-item').forEach(el => {
            el.addEventListener('click', async (e) => {
                if (e.target.classList.contains('del-btn')) return;
                await selectCard(el.dataset.id);
            });
        });

        // Delete buttons
        container.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await deleteCard(btn.dataset.id);
            });
        });
    } catch (err) {
        setStatus('❌ Failed to load DataCards: ' + err.message, 'error');
    }
}

async function selectCard(cardId) {
    try {
        const card = await apiFetch(`/api/datacards/${cardId}`, 'GET');
        selectedCardData = card.data;
        extractedData = card.data; // Use card data for field mapping

        // Highlight selected card
        document.querySelectorAll('.card-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.card-item[data-id="${cardId}"]`)?.classList.add('selected');

        showExtractedData(card.data);
        setStatus(`✅ Loaded DataCard: ${card.name}`, 'success');

        // Re-render form field mappings with the card data
        if (detectedFields.length > 0) {
            renderFormFields();
        }
    } catch (err) {
        setStatus('❌ ' + err.message, 'error');
    }
}

async function deleteCard(cardId) {
    try {
        await apiFetch(`/api/datacards/${cardId}`, 'DELETE');
        setStatus('✅ DataCard deleted', 'success');
        loadDataCards();
    } catch (err) {
        setStatus('❌ ' + err.message, 'error');
    }
}

// ===== Form Scanning & Filling =====
function scanFormFields() {
    setStatus('<span class="spinner"></span> Scanning page...', 'info');
    chrome.runtime.sendMessage({ type: 'SCAN_FORM' }, (fields) => {
        if (chrome.runtime.lastError) {
            setStatus('❌ Cannot scan this page. Try reloading.', 'error');
            return;
        }
        if (!fields || fields.length === 0) {
            setStatus('No form fields found on this page.', 'info');
            $('formFields').innerHTML = '<p style="color:#7878a0;font-size:11px;">No fields detected.</p>';
            return;
        }

        detectedFields = fields;
        renderFormFields();
        setStatus(`✅ Found ${fields.length} form fields`, 'success');
        $('autoFillPageBtn').disabled = false;
    });
}

function renderFormFields() {
    const container = $('formFields');
    const activeData = extractedData || {};
    const dataKeys = flattenKeys(activeData);

    container.innerHTML = detectedFields.map(f => `
        <div class="field-row">
            <span class="field-label" title="${escapeHtml(f.label)}">${escapeHtml(f.label)}</span>
            <select id="map-${f.id}">
                <option value="">-- Map --</option>
                ${dataKeys.map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <button class="small-btn fill-one-btn" data-field="${f.id}">Fill</button>
        </div>
    `).join('');

    // Auto-match: try to intelligently match field labels/names to data keys
    detectedFields.forEach(f => {
        const selectEl = document.getElementById(`map-${f.id}`);
        if (!selectEl) return;
        const matchKey = autoMatch(f, dataKeys);
        if (matchKey) selectEl.value = matchKey;
    });

    // Fill individual button handlers
    container.querySelectorAll('.fill-one-btn').forEach(btn => {
        btn.addEventListener('click', () => fillSingleField(btn.dataset.field));
    });

    // Enable Fill All
    $('fillAllBtn').disabled = dataKeys.length === 0;
}

function autoMatch(field, dataKeys) {
    const hints = [field.name, field.label, field.placeholder].filter(Boolean).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    for (const key of dataKeys) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const hint of hints) {
            if (hint.includes(normalizedKey) || normalizedKey.includes(hint)) {
                return key;
            }
        }
    }
    return null;
}

function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            keys = keys.concat(flattenKeys(v, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function fillSingleField(fieldId) {
    const selectEl = document.getElementById(`map-${fieldId}`);
    if (!selectEl) return;
    const key = selectEl.value;
    if (!key || !extractedData) return;

    let value = getNestedValue(extractedData, key);
    if (Array.isArray(value)) value = value.join(', ');
    if (value === null || value === undefined) return;

    chrome.runtime.sendMessage({
        type: 'FILL_FIELD',
        fieldId,
        value: String(value)
    }, (resp) => {
        if (resp?.success) {
            setStatus(`✅ Filled ${key}`, 'success');
        }
    });
}

async function handleAutoFillPage() {
    if (!selectedCardData || !selectedCardData._id) {
        setStatus('⚠️ Please select a Data Card first.', 'info');
        return;
    }
    
    $('autoFillPageBtn').disabled = true;
    $('autoFillPageBtn').textContent = 'Auto-Filling...';
    setStatus('<span class="spinner"></span> Mapping fields with AI...', 'info');
    
    chrome.runtime.sendMessage({ 
        type: 'AUTO_FILL_PAGE', 
        dataCardId: selectedCardData._id 
    }, (resp) => {
        $('autoFillPageBtn').disabled = false;
        $('autoFillPageBtn').textContent = 'Auto-Fill This Page';
        
        if (chrome.runtime.lastError || resp.error) {
            setStatus('❌ Auto-fill failed: ' + (chrome.runtime.lastError?.message || resp.error), 'error');
            return;
        }
        
        setStatus(`✅ ${resp.filled} filled, ${resp.needsReview} need review, ${resp.unmatched} unmatched`, 'success');
    });
}

// ===== Chat =====
async function handleChatSend() {
    const message = $('chatInput').value.trim();
    if (!message || !currentSessionId) {
        if (!currentSessionId) setStatus('⚠️ Upload a document first to chat.', 'info');
        return;
    }

    appendChat('user', message);
    $('chatInput').value = '';
    $('chatSendBtn').disabled = true;

    try {
        const res = await apiFetch('/api/chat', 'POST', {
            sessionId: currentSessionId,
            message
        });
        appendChat('assistant', res.response);
    } catch (err) {
        appendChat('assistant', '❌ Error: ' + err.message);
    } finally {
        $('chatSendBtn').disabled = false;
    }
}

function appendChat(role, text) {
    const chatArea = $('chatArea');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ===== Utilities =====
async function apiFetch(path, method = 'GET', body = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
        // Handle expired token
        if (res.status === 401) {
            handleLogout();
            throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.error || `Request failed (${res.status})`);
    }

    return data;
}

function setStatus(html, type) {
    const bar = $('statusBar');
    bar.innerHTML = html;
    bar.className = `status ${type}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
