// ===== Variables =====
let currentActivity = null;
let startTime = null;
let timerInterval = null;

// ===== DOM Elements =====
const activitySelect = document.getElementById('activity');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logsTableBody = document.getElementById('logsTable').querySelector('tbody');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const runningTimerDisplay = document.getElementById('runningTimer');

// ===== Helper Functions =====
function getLogs() {
  return JSON.parse(localStorage.getItem('activityLogs')) || [];
}

function saveLogs(logs) {
  localStorage.setItem('activityLogs', JSON.stringify(logs));
}

// ===== Render Logs =====
function renderLogs() {
  const logs = getLogs().sort((a, b) => new Date(b.start) - new Date(a.start));
  logsTableBody.innerHTML = '';
  logs.forEach(log => {
    const tr = document.createElement('tr');
    const start = new Date(log.start).toLocaleString();
    const end = log.end ? new Date(log.end).toLocaleString() : '-';
    const duration = log.end ? ((new Date(log.end) - new Date(log.start)) / 60000).toFixed(1) + ' min' : '-';
    tr.innerHTML = `<td>${log.activity}</td><td>${start}</td><td>${end}</td><td>${duration}</td>`;
    logsTableBody.appendChild(tr);
  });
}

// ===== Running Timer =====
function startRunningTimer() {
  if (!currentActivity) return;
  timerInterval = setInterval(() => {
    const now = new Date();
    const start = new Date(startTime);
    const elapsed = Math.floor((now - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    runningTimerDisplay.textContent = `Current activity: ${currentActivity} — ${minutes}m ${seconds}s`;
  }, 1000);
}

function stopRunningTimer() {
  clearInterval(timerInterval);
  runningTimerDisplay.textContent = `Current activity: None`;
}

// ===== Event Listeners =====

// Start activity
startBtn.addEventListener('click', () => {
  if (currentActivity) {
    alert('Finish the current activity before starting a new one.');
    return;
  }
  currentActivity = activitySelect.value;
  startTime = new Date().toISOString();
  startRunningTimer();
});

// Stop activity
stopBtn.addEventListener('click', () => {
  if (!currentActivity) {
    alert('No activity in progress.');
    return;
  }

  const endTime = new Date().toISOString();
  const logs = getLogs();
  logs.push({ activity: currentActivity, start: startTime, end: endTime });
  saveLogs(logs);

  currentActivity = null;
  startTime = null;
  stopRunningTimer();
  renderLogs();
});

// Clear logs
clearLogsBtn.addEventListener('click', () => {
  if (!confirm('Are you sure you want to clear all logs?')) return;
  localStorage.removeItem('activityLogs');
  renderLogs();
});

// Initial render
renderLogs();
