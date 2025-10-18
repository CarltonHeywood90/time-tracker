// ===== Variables =====
let currentActivity = null;
let startTime = null;
let timerInterval = null;
let useFirestore = true;

// ===== DOM Elements =====
const activitySelect = document.getElementById('activity');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logsTableBody = document.getElementById('logsTable').querySelector('tbody');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const runningTimerDisplay = document.getElementById('runningTimer');
const warningDiv = document.createElement('div'); // optional on-screen warning
document.body.prepend(warningDiv);

// ===== Helper Functions =====
function getLocalLogs() {
  return JSON.parse(localStorage.getItem('activityLogs')) || [];
}

function saveLocalLogs(logs) {
  localStorage.setItem('activityLogs', JSON.stringify(logs));
}

// ===== Render Logs =====
function renderLogs(snapshot = null) {
  logsTableBody.innerHTML = '';

  let logsArray = [];

  if (useFirestore && snapshot) {
    snapshot.forEach(doc => logsArray.push(doc.data()));
  } else {
    logsArray = getLocalLogs().sort((a,b) => new Date(b.start) - new Date(a.start));
  }

  logsArray.forEach(log => {
    const tr = document.createElement('tr');
    const start = new Date(log.start).toLocaleString();
    const end = log.end ? new Date(log.end).toLocaleString() : '-';
    const duration = log.end ? ((new Date(log.end) - new Date(log.start))/60000).toFixed(1) + ' min' : '-';
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

// ===== Initialize Firestore Safely =====
let logsCollection;
try {
  logsCollection = db.collection('activityLogs');
} catch (err) {
  console.warn("Firestore not available, using localStorage fallback", err);
  useFirestore = false;
  warningDiv.textContent = "⚠️ Firestore unavailable. Logs will be saved locally only.";
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
  if (!currentActivity) return;

  const endTime = new Date().toISOString();
  const logEntry = { activity: currentActivity, start: startTime, end: endTime };

  if (useFirestore) {
    try {
      await logsCollection.add(logEntry);
    } catch (err) {
      console.warn("Firestore write failed, saving locally", err);
      useFirestore = false;
      saveLocalLogs([...getLocalLogs(), logEntry]);
      warningDiv.textContent = "⚠️ Firestore failed, saving locally only.";
    }
  } else {
    saveLocalLogs([...getLocalLogs(), logEntry]);
  }

  currentActivity = null;
  startTime = null;
  stopRunningTimer();
});

clearLogsBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all logs?')) return;

  if (useFirestore) {
    try {
      const snapshot = await logsCollection.get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (err) {
      console.warn("Firestore clear failed, clearing localStorage", err);
      useFirestore = false;
      saveLocalLogs([]);
      warningDiv.textContent = "⚠️ Firestore clear failed, clearing local logs instead.";
    }
  } else {
    saveLocalLogs([]);
  }
});

// ===== Real-Time Listener =====
if (useFirestore) {
  logsCollection.orderBy('start', 'desc').onSnapshot(
    snapshot => renderLogs(snapshot),
    error => {
      console.warn("Realtime Firestore failed, falling back to localStorage", error);
      useFirestore = false;
      warningDiv.textContent = "⚠️ Firestore realtime failed, using local logs.";
      renderLogs();
    }
  );
} else {
  renderLogs();
}
