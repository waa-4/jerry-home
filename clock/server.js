// LIVE CLOCK
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString();
  document.getElementById("clock").textContent = time;
}
setInterval(updateClock, 1000);
updateClock();


// TIMER
let timerInterval;
let remainingSeconds = 0;
let isPaused = false;

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    String(h).padStart(2, '0') + ":" +
    String(m).padStart(2, '0') + ":" +
    String(s).padStart(2, '0')
  );
}

function startTimer() {
  if (!isPaused) {
    const h = parseInt(document.getElementById("hours").value) || 0;
    const m = parseInt(document.getElementById("minutes").value) || 0;
    const s = parseInt(document.getElementById("seconds").value) || 0;
    remainingSeconds = h * 3600 + m * 60 + s;
  }

  if (remainingSeconds <= 0) return;

  isPaused = false;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remainingSeconds--;
    document.getElementById("timerDisplay").textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      document.getElementById("alarmSound").play();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isPaused = true;
}

function resetTimer() {
  clearInterval(timerInterval);
  remainingSeconds = 0;
  isPaused = false;
  document.getElementById("timerDisplay").textContent = "00:00:00";
}
