// ===== Helpers =====
function pad2(n){ return String(n).padStart(2,'0'); }

function formatHMS(totalSec){
  totalSec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function readInputs(){
  const h = Math.max(0, parseInt(document.getElementById("hours").value) || 0);
  const m = Math.max(0, parseInt(document.getElementById("minutes").value) || 0);
  const s = Math.max(0, parseInt(document.getElementById("seconds").value) || 0);

  // clamp mins + secs
  const mm = Math.min(59, m);
  const ss = Math.min(59, s);
  const hh = Math.min(99, h);

  // write clamped values back (so you SEE what it accepted)
  document.getElementById("hours").value = hh;
  document.getElementById("minutes").value = mm;
  document.getElementById("seconds").value = ss;

  return hh * 3600 + mm * 60 + ss;
}

// ===== Live Clock (local) =====
function updateLocalClock(){
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("clockDate").textContent = now.toLocaleDateString(undefined, {
    weekday:"long", year:"numeric", month:"short", day:"numeric"
  });
}
setInterval(updateLocalClock, 1000);
updateLocalClock();

// ===== Time Zone Clock =====
const tzSelect = document.getElementById("tzSelect");
const tzTime = document.getElementById("tzTime");
const tzDate = document.getElementById("tzDate");

// A good starter list (easy to edit/add)
const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland"
];

for (const tz of TIMEZONES){
  const opt = document.createElement("option");
  opt.value = tz;
  opt.textContent = tz;
  tzSelect.appendChild(opt);
}

// default: your local-ish (try LA first)
tzSelect.value = "America/Los_Angeles";

function updateTzClock(){
  const tz = tzSelect.value;
  const now = new Date();
  try{
    tzTime.textContent = now.toLocaleTimeString(undefined, { timeZone: tz });
    tzDate.textContent = now.toLocaleDateString(undefined, {
      timeZone: tz, weekday:"long", year:"numeric", month:"short", day:"numeric"
    });
  }catch(e){
    tzTime.textContent = "Time zone not supported";
    tzDate.textContent = "";
  }
}
tzSelect.addEventListener("change", updateTzClock);
setInterval(updateTzClock, 1000);
updateTzClock();

// ===== Timer =====
const alarm = document.getElementById("alarmSound");
const preview = document.getElementById("timerPreview");
const display = document.getElementById("timerDisplay");
const hint = document.getElementById("timerHint");

const setBtn = document.getElementById("setBtn");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

let timerInterval = null;
let remaining = 0;
let locked = false;   // “Set” locks the value so Start doesn’t re-read inputs
let running = false;

function updatePreview(){
  const total = readInputs();
  preview.textContent = formatHMS(total);
  if (!locked && !running) display.textContent = formatHMS(total);
}
["hours","minutes","seconds"].forEach(id=>{
  document.getElementById(id).addEventListener("input", updatePreview);
});
updatePreview();

setBtn.addEventListener("click", ()=>{
  remaining = readInputs();
  locked = true;
  running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  display.textContent = formatHMS(remaining);
  hint.textContent = remaining > 0 ? "Locked in. Press Start." : "Set a time above 0:00:00.";
});

startBtn.addEventListener("click", ()=>{
  // browsers often require a user action before audio can play — this click counts
  if (!locked){
    remaining = readInputs();
  }
  if (remaining <= 0){
    hint.textContent = "Timer is 0. Set something like 00:00:07 then press Set.";
    return;
  }

  if (running) return;
  running = true;
  hint.textContent = "Running...";

  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    remaining--;
    display.textContent = formatHMS(remaining);

    if (remaining <= 0){
      clearInterval(timerInterval);
      timerInterval = null;
      running = false;
      locked = false;
      display.textContent = "00:00:00";
      hint.textContent = "DONE ✅";
      try { alarm.currentTime = 0; alarm.play(); } catch(e){}
    }
  }, 1000);
});

pauseBtn.addEventListener("click", ()=>{
  if (!running) return;
  running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  hint.textContent = "Paused. Press Start to continue.";
});

resetBtn.addEventListener("click", ()=>{
  running = false;
  locked = false;
  clearInterval(timerInterval);
  timerInterval = null;
  remaining = 0;
  display.textContent = "00:00:00";
  preview.textContent = "00:00:00";
  hint.textContent = "Reset. Type a time then press Set.";
  document.getElementById("hours").value = "";
  document.getElementById("minutes").value = "";
  document.getElementById("seconds").value = "";
});
