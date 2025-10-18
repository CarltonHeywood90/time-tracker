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
async function getLogs() {
  try {
    const res = await fetch('/api/get-logs');
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
  } catch (err) {
    console.error(err);
    alert("Unable to load logs.");
    return [];
  }
}

async function addLog(activity, start, end) {
  try {
    stopBtn.disabled = true; // Prevent double submission
    const res = await fetch('/api/add-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity, start, end })
    });
    if (!res.ok) throw new Error("Failed to save log");
  } catch (err) {
    console.error(err);
    alert("Unable to save log.");
  } finally {
    stopBtn.disabled = false;
  }
}

// ===== Render Logs =====
async function renderLogs() {
  logsTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
  const logs = (await getLogs()).sort((a, b) => new Date(b.start) - new Date(a.start));
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
startBtn.addEventListener('click', () => {
  if (currentActivity) {
    alert('Finish the current activity before starting a new one.');
    return;
  }
  currentActivity = activitySelect.value;
  startTime = new Date().toISOString();
  startRunningTimer();
});

stopBtn.addEventListener('click', async () => {
  if (!currentActivity) {
    alert('No activity in progress.');
    return;
  }
  const endTime = new Date().toISOString();
  await addLog(currentActivity, startTime, endTime);
  currentActivity = null;
  startTime = null;
  stopRunningTimer();
  renderLogs();
});

clearLogsBtn.addEventListener('click', async () => {
  if (!confirm("Are you sure you want to clear all logs?")) return;

  try {
    const res = await fetch('/api/clear-logs', { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      renderLogs(); // refresh table
    } else {
      alert(data.error || "Failed to clear logs");
    }
  } catch (err) {
    console.error(err);
    alert("Error clearing logs");
  }
});

// Initial render
renderLogs();

function startRunningTimer() {
  if (!currentActivity) return;
  timerInterval = setInterval(() => {
    const now = new Date();
    const start = new Date(startTime);
    const elapsed = Math.floor((now - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    runningTimerDisplay.textContent = `Current activity: ${currentActivity} — ${minutes}m ${seconds}s`;
    
    // optional: grow text slightly every second
    runningTimerDisplay.style.fontSize = `${4 + Math.min(elapsed/30, 6)}rem`;
  }, 1000);
}
