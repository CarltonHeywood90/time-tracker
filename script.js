// ===== Variables =====
let currentActivity = null;
let startTime = null;

// Load existing logs from localStorage or initialize empty array
const logs = JSON.parse(localStorage.getItem('activityLogs')) || [];

// ===== DOM Elements =====
const activitySelect = document.getElementById('activity');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logsTableBody = document.getElementById('logsTable').querySelector('tbody');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// ===== Functions =====

// Render the activity logs table
function renderLogs() {
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

// ===== Event Listeners =====

// Start an activity
startBtn.addEventListener('click', () => {
  if (currentActivity) {
    alert('Finish the current activity before starting a new one.');
    return;
  }
  currentActivity = activitySelect.value;
  startTime = new Date().toISOString();
  alert(`Started ${currentActivity} at ${new Date(startTime).toLocaleTimeString()}`);
});

// Stop the current activity and save to logs
stopBtn.addEventListener('click', () => {
  if (!currentActivity) {
    alert('No activity in progress.');
    return;
  }
  const endTime = new Date().toISOString();
  logs.push({ activity: currentActivity, start: startTime, end: endTime });
  localStorage.setItem('activityLogs', JSON.stringify(logs));
  currentActivity = null;
  startTime = null;
  renderLogs();
});

// Clear all logs
clearLogsBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all logs?')) {
    logs.length = 0;
    localStorage.setItem('activityLogs', JSON.stringify(logs));
    renderLogs();
  }
});

// ===== Initial Render =====
renderLogs();


const runningTimerDisplay = document.getElementById('runningTimer');
let timerInterval = null;

// Update running timer every second
function startRunningTimer() {
  if (!currentActivity) return;
  timerInterval = setInterval(() => {
    const now = new Date();
    const start = new Date(startTime);
    const elapsed = Math.floor((now - start) / 1000); // seconds
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    runningTimerDisplay.textContent = `Current activity: ${currentActivity} — ${minutes}m ${seconds}s`;
  }, 1000);
}

// Stop the running timer
function stopRunningTimer() {
  clearInterval(timerInterval);
  runningTimerDisplay.textContent = `Current activity: None`;
}

// Modify Start button listener
startBtn.addEventListener('click', () => {
  if (currentActivity) {
    alert('Finish the current activity before starting a new one.');
    return;
  }
  currentActivity = activitySelect.value;
  startTime = new Date().toISOString();
  alert(`Started ${currentActivity} at ${new Date(startTime).toLocaleTimeString()}`);
  startRunningTimer(); // start live timer
});

// Modify Stop button listener
stopBtn.addEventListener('click', () => {
  if (!currentActivity) {
    alert('No activity in progress.');
    return;
  }
  const endTime = new Date().toISOString();
  logs.push({ activity: currentActivity, start: startTime, end: endTime });
  localStorage.setItem('activityLogs', JSON.stringify(logs));
  currentActivity = null;
  startTime = null;
  stopRunningTimer(); // stop live timer
  renderLogs();
});

