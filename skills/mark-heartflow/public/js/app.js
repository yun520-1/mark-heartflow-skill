// HeartFlow Control UI - Application Logic

let currentPage = 'dashboard';
let configData = {};
let logsData = [];
let sessionsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  setupNavigation();
  loadPage('dashboard');
});

// Navigation
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  document.getElementById('currentPage').textContent = page.charAt(0).toUpperCase() + page.slice(1);
  loadPage(page);
}

// Page Loader
async function loadPage(page) {
  const content = document.getElementById('contentArea');
  
  try {
    const response = await fetch(`/api/ui/${page}`);
    const html = await response.text();
    content.innerHTML = html;
    
    // Initialize page-specific functionality
    initPage(page);
  } catch (e) {
    content.innerHTML = getErrorPage(page);
  }
}

function initPage(page) {
  switch(page) {
    case 'dashboard': initDashboard(); break;
    case 'chat': initChat(); break;
    case 'config': initConfig(); break;
    case 'models': initModels(); break;
    case 'cron': initCron(); break;
    case 'logs': initLogs(); break;
  }
}

// Dashboard
function initDashboard() {
  fetch('/api/status').then(r => r.json()).then(data => {
    document.getElementById('statVersion').textContent = data.version || 'v7.3.104';
    document.getElementById('statUptime').textContent = data.uptime || '0h';
    document.getElementById('statSessions').textContent = data.sessions || '0';
    document.getElementById('statMemory').textContent = data.memory || '0%';
  });
}

// Chat
function initChat() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  
  loadChatHistory();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  
  addMessage('user', message);
  input.value = '';
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message})
  });
  
  const data = await response.json();
  addMessage('assistant', data.response || data.message || '...');
}

function addMessage(role, content) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="message-avatar ${role}">${role === 'user' ? '👤' : '💜'}</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(content)}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function loadChatHistory() {
  try {
    const response = await fetch('/api/sessions');
    const data = await response.json();
    // Load history into chat
  } catch (e) {
    console.log('No history');
  }
}

// Config
function initConfig() {
  fetch('/api/config').then(r => r.json()).then(data => {
    document.getElementById('configJson').value = JSON.stringify(data, null, 2);
  });
}

function saveConfig() {
  const json = document.getElementById('configJson').value;
  fetch('/api/config', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: json
  }).then(() => alert('Config saved!'));
}

function resetConfig() {
  if (confirm('Reset to defaults?')) {
    fetch('/api/config/reset', {method: 'POST'}).then(() => loadPage('config'));
  }
}

// Models
function initModels() {
  fetch('/api/models').then(r => r.json()).then(data => {
    const list = document.getElementById('modelsList');
    list.innerHTML = data.providers?.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.model}</td>
        <td><span class="status"><span class="status-dot ${p.enabled ? 'active' : 'inactive'}"></span>${p.enabled ? 'Enabled' : 'Disabled'}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="testModel('${p.id}')">Test</button>
          <button class="btn btn-sm btn-primary" onclick="setDefaultModel('${p.id}')">Set Default</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="4">No models configured</td></tr>';
  });
}

// Cron
function initCron() {
  fetch('/api/cron').then(r => r.json()).then(data => {
    const list = document.getElementById('cronList');
    list.innerHTML = data.jobs?.map(j => `
      <tr>
        <td>${j.name}</td>
        <td>${j.schedule}</td>
        <td>${j.status}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="toggleCron('${j.id}')">${j.enabled ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCron('${j.id}')">Delete</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="4">No cron jobs</td></tr>';
  });
}

function addCronJob() {
  const name = prompt('Job name:');
  const schedule = prompt('Schedule (e.g., 0 * * * *):');
  if (name && schedule) {
    fetch('/api/cron', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name, schedule})
    }).then(() => initCron());
  }
}

// Logs
function initLogs() {
  fetch('/api/logs').then(r => r.json()).then(data => {
    const container = document.getElementById('logsContainer');
    container.innerHTML = data.logs?.map(l => `
      <div class="log-entry">
        <span class="log-time">[${l.time}]</span>
        <span class="log-level ${l.level}">${l.level.toUpperCase()}</span>
        <span class="log-message">${escapeHtml(l.message)}</span>
      </div>
    `).join('') || '<div class="empty-state">No logs yet</div>';
  });
}

// Utilities
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function refreshData() {
  loadPage(currentPage);
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    configData = await response.json();
  } catch (e) {
    console.log('Using default config');
  }
}

// Model switching
function switchModel(modelId) {
  fetch('/api/models/set', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model: modelId})
  }).then(() => alert(`Switched to ${modelId}`));
}

// Dream mode
function toggleDreamMode() {
  const toggle = document.getElementById('dreamToggle');
  fetch('/api/dream', {
    method: toggle.checked ? 'POST' : 'DELETE',
    headers: {'Content-Type': 'application/json'}
  }).then(r => r.json()).then(data => {
    alert(data.message || `Dream mode ${toggle.checked ? 'enabled' : 'disabled'}`);
  });
}

function showSettings() {
  navigateTo('settings');
}

// Error page fallback
function getErrorPage(page) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🔧</div>
      <div class="empty-state-title">Page: ${page}</div>
      <p>Loading...</p>
    </div>
  `;
}

// Export for global use
window.navigateTo = navigateTo;
window.switchModel = switchModel;
window.toggleDreamMode = toggleDreamMode;
window.refreshData = refreshData;
window.sendMessage = sendMessage;
window.saveConfig = saveConfig;
window.resetConfig = resetConfig;
window.testModel = function(id) { alert('Testing model: ' + id); };
window.setDefaultModel = function(id) { switchModel(id); };
window.addCronJob = addCronJob;
window.toggleCron = function(id) { initCron(); };
window.deleteCron = function(id) { if(confirm('Delete this job?')) initCron(); };
window.showSettings = showSettings;