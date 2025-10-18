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
const runningTimerNumbers = document.getElementById('runningTimerNumbers'); // large numbers only

// Initial render of logs and pie chart
renderLogs().then(renderActivityChart); // chart shows initial state

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

    // Only update the numbers span
    runningTimerNumbers.textContent = `${minutes}m ${seconds}s`;
  }, 1000);
}

function stopRunningTimer() {
  clearInterval(timerInterval);
  runningTimerNumbers.textContent = "None";
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
  renderLogs().then(renderActivityChart); // <-- render chart after logs update
});


clearLogsBtn.addEventListener('click', async () => {
  if (!confirm("Are you sure you want to clear all logs?")) return;

  try {
    const res = await fetch('/api/clear-logs', { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      renderLogs().then(renderActivityChart); // <-- also update chart
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

let activityChart = null;

async function renderActivityChart() {
  const logs = await getLogs();

  // Count totals per activity
  const totals = {};
  logs.forEach(log => {
    if (!totals[log.activity]) totals[log.activity] = 0;
    totals[log.activity] += 1;
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);

  const ctx = document.getElementById('activityChart').getContext('2d');

  // Destroy existing chart if it exists
  if (activityChart) activityChart.destroy();

  activityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}%`;
            }
          }
        }
      }
    }
  });
}

// Call chart render after logs update
renderLogs().then(renderActivityChart);
