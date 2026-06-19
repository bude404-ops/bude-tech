document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  fetch('/health').then(r => r.json()).then(d => { status.textContent = 'Server: ' + d.status; status.style.color = '#4caf50'; })
    .catch(() => { status.textContent = 'Server: offline'; status.style.color = '#ff9800'; });
});