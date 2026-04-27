async function refreshStatus() {
  const versionEl = document.getElementById('version');
  const serviceEl = document.getElementById('service');
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    versionEl.textContent = data.version || '10.16.6';
    serviceEl.innerHTML = '<span class="ok">在线</span>';
  } catch (e) {
    versionEl.textContent = '10.16.6';
    serviceEl.innerHTML = '<span class="bad">异常</span>';
  }
}

document.addEventListener('DOMContentLoaded', refreshStatus);
