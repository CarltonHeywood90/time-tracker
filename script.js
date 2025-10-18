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

// ===== Firestore Collection Reference =====
const logsCollection = db.collection('activityLogs');

// ===== Functions =====

// Render the activity logs table
function renderLogs(snapshot) {
  logsTableBody.innerHTML = '';
  snapshot.forEach(doc => {
    const log = doc.data();
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
    const elapsed = Math.floor((now - start) / 1000); // seconds
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
  alert(`Started ${currentActivity} at ${new Date(startTime).toLocaleTimeString()}`);
  startRunningTimer();
});

// Stop activity
stopBtn.addEventListener('click', async () => {
  if (!currentActivity) {
    alert('No activity in progress.');
    return;
  }
  const endTime = new Date().toISOString();
  // Save log to Firestore
  await logsCollection.add({
    activity: currentActivity,
    start: startTime,
    end: endTime
  });

  currentActivity = null;
  startTime = null;
  stopRunningTimer();
});

// Clear all logs
clearLogsBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all logs?')) return;

  const snapshot = await logsCollection.get();
  const batch = db.batch();
  snapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
});

// ===== Real-Time Listener =====
logsCollection.orderBy('start', 'desc').onSnapshot(snapshot => {
  renderLogs(snapshot);
});
