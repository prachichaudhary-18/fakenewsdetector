const API_BASE = "http://localhost:5000";

document.addEventListener('DOMContentLoaded', async () => {
    const loginView = document.getElementById('login-view');
    const scanView = document.getElementById('scan-view');
    const displayUrl = document.getElementById('display-url');
    const loginForm = document.getElementById('login-form');
    const scanBtn = document.getElementById('scan-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Check auth status
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showView('login');
    } else {
        showView('scan');
        getCurrentTabUrl();
    }

    // Login Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('auth-error');

        try {
            const resp = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await resp.json();
            if (resp.ok) {
                await chrome.storage.local.set({ token: data.token });
                showView('scan');
                getCurrentTabUrl();
            } else {
                errorEl.textContent = data.message || "Login failed";
            }
        } catch (err) {
            errorEl.textContent = "Server connection failed";
        }
    });

    // Scan Handler
    scanBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url) return;

        setState('loading');
        
        try {
            const { token } = await chrome.storage.local.get('token');
            const resp = await fetch(`${API_BASE}/scan`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: tab.url })
            });

            const data = await resp.json();
            if (resp.ok) {
                displayResult(data);
            } else {
                alert(data.message || "Scan failed");
                setState('idle');
            }
        } catch (err) {
            alert("Connection to backend failed");
            setState('idle');
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove('token');
        showView('login');
    });

    // Reset Handler
    document.getElementById('reset-btn').addEventListener('click', () => {
        setState('idle');
    });

    function showView(view) {
        loginView.classList.add('hidden');
        scanView.classList.add('hidden');
        if (view === 'login') loginView.classList.remove('hidden');
        if (view === 'scan') scanView.classList.remove('hidden');
    }

    function setState(state) {
        document.getElementById('idle-state').classList.add('hidden');
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('result-state').classList.add('hidden');
        document.getElementById(`${state}-state`).classList.remove('hidden');
    }

    async function getCurrentTabUrl() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        displayUrl.textContent = tab.url;
    }

    function displayResult(data) {
        setState('result');
        const verdictEl = document.getElementById('verdict-label');
        const confidenceEl = document.getElementById('confidence-value');
        const listEl = document.getElementById('phrases-list');

        verdictEl.textContent = `${data.verdict.toUpperCase()} CONTENT`;
        verdictEl.className = data.verdict.toLowerCase() === 'fake' ? 'fake-text' : 'real-text';
        confidenceEl.textContent = `Confidence Score: ${Math.round(data.confidence * 100)}%`;

        listEl.innerHTML = '';
        const phrases = (data.highlights || []).slice(0, 3);
        if (phrases.length > 0) {
            phrases.forEach(p => {
                const li = document.createElement('li');
                li.textContent = `"${p.phrase || p}"`; // Handle both object and string fallback
                listEl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No significant markers found.";
            li.style.border = "none";
            listEl.appendChild(li);
        }
    }
});
