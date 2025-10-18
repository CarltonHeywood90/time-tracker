// ===== Variables =====
let currentActivity = null;
let startTime = null;
let timerInterval = null;
let activityChart = null;

// ===== DOM Elements =====
const activitySelect = document.getElementById('activity');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logsTableBody = document.getElementById('logsTable').querySelector('tbody');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const runningTimerNumbers = document.getElementById('runningTimerNumbers');
const activityDateInput = document.getElementById('activityDate');

// ===== Set default date to today =====
const today = new Date().toISOString().split('T')[0];
activityDateInput.value = today;

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
    stopBtn.disabled = true;
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
  const selectedDate = activityDateInput.value;
  logsTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  const logs = (await getLogs())
    .filter(log => new Date(log.start).toISOString().split('T')[0] === selectedDate)
    .sort((a, b) => new Date(b.start) - new Date(a.start));

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
    runningTimerNumbers.textContent = `${minutes}m ${seconds}s`;
  }, 1000);
}

function stopRunningTimer() {
  clearInterval(timerInterval);
  runningTimerNumbers.textContent = "None";
}

// ===== Render Pie Chart =====
async function renderActivityChart() {
  const selectedDate = activityDateInput.value;
  const logs = (await getLogs()).filter(log => new Date(log.start).toISOString().split('T')[0] === selectedDate);

  // Sum total time per activity
  const totals = {};
  logs.forEach(log => {
    const start = new Date(log.start);
    const end = log.end ? new Date(log.end) : new Date();
    const duration = (end - start) / 60000;
    totals[log.activity] = (totals[log.activity] || 0) + duration;
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals).map(v => parseFloat(v.toFixed(1)));

  const ctx = document.getElementById('activityChart').getContext('2d');

  if (activityChart) activityChart.destroy();

  activityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a,b)=>a+b,0);
              const value = context.parsed;
              const percent = ((value/total)*100).toFixed(1);
              return `${context.label}: ${value} min (${percent}%)`;
            }
          }
        },
        datalabels: {
          color: '#fff',
          formatter: (value) => `${value} min`,
          font: { weight: 'bold', size: 14 }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ===== Event Listeners =====
startBtn.addEventListener('click', () => {
  const selectedDate = activityDateInput.value;
  const today = new Date().toISOString().split('T')[0];
  if (selectedDate !== today) return alert("You can only track time for today.");

  if (currentActivity) {
    alert("Finish current activity before starting a new one.");
    return;
  }

  currentActivity = activitySelect.value;
  startTime = new Date().toISOString();
  startRunningTimer();
});

stopBtn.addEventListener('click', async () => {
  if (!currentActivity) return alert("No activity in progress.");
  const endTime = new Date().toISOString();
  await addLog(currentActivity, startTime, endTime);
  currentActivity = null;
  startTime = null;
  stopRunningTimer();
  renderLogs().then(renderActivityChart);
});

clearLogsBtn.addEventListener('click', async () => {
  if (!confirm("Are you sure you want to clear all logs?")) return;
  try {
    const res = await fetch('/api/clear-logs', { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      renderLogs().then(renderActivityChart);
    } else {
      alert(data.error || "Failed to clear logs");
    }
  } catch (err) {
    console.error(err);
    alert("Error clearing logs");
  }
});

activityDateInput.addEventListener('change', () => renderLogs().then(renderActivityChart));

// ===== Initial render =====
renderLogs().then(renderActivityChart);
