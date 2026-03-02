const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });

const toast = document.getElementById("toast");

const preset = document.getElementById("preset");
const customSize = document.getElementById("customSize");
const customW = document.getElementById("customW");
const customH = document.getElementById("customH");
const bgColor = document.getElementById("bgColor");
const btnApplySize = document.getElementById("btnApplySize");

const toolDraw = document.getElementById("toolDraw");
const toolText = document.getElementById("toolText");
const toolEraser = document.getElementById("toolEraser");
const stampImage = document.getElementById("stampImage");

const brushSize = document.getElementById("brushSize");
const inkColor = document.getElementById("inkColor");
const textSize = document.getElementById("textSize");
const font = document.getElementById("font");

const btnPNG = document.getElementById("btnPNG");
const btnJPG = document.getElementById("btnJPG");
const btnClear = document.getElementById("btnClear");

const btnNew = document.getElementById("btnNew");
const importAsCanvas = document.getElementById("importAsCanvas");

const newModal = document.getElementById("newModal");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");

// ===== State =====
let activeTool = "draw"; // draw | text | eraser | stamp
let drawing = false;
let last = null;

let bg = "#ffffff";
let pendingStampImage = null; // HTMLImageElement
let stampScale = 1; // simple v1

function say(msg) {
  toast.textContent = msg;
}

// ===== Canvas sizing + background =====
function setCanvasSize(w, h) {
  // Save current image
  const old = document.createElement("canvas");
  old.width = canvas.width || 1;
  old.height = canvas.height || 1;
  old.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = w;
  canvas.height = h;

  // Fill background
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Try to draw old content scaled to fit (simple)
  if (old.width > 1 && old.height > 1) {
    const scale = Math.min(w / old.width, h / old.height);
    const dw = Math.floor(old.width * scale);
    const dh = Math.floor(old.height * scale);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);
    ctx.drawImage(old, dx, dy, dw, dh);
  }

  say(`Canvas: ${w}×${h}`);
}

function parsePreset(v) {
  if (v === "custom") return null;
  const [w, h] = v.split("x").map(n => parseInt(n, 10));
  if (!w || !h) return null;
  return { w, h };
}

preset.addEventListener("change", () => {
  customSize.style.display = (preset.value === "custom") ? "grid" : "none";
});

btnApplySize.addEventListener("click", () => {
  let w, h;
  const p = parsePreset(preset.value);
  if (p) {
    w = p.w; h = p.h;
  } else {
    w = Math.max(1, parseInt(customW.value || "1280", 10));
    h = Math.max(1, parseInt(customH.value || "720", 10));
  }
  setCanvasSize(w, h);
});

bgColor.addEventListener("input", () => {
  bg = bgColor.value;
  // Fill only empty background by repainting entire canvas under current pixels:
  // v1 approach: draw current image to temp, clear, fill bg, then redraw.
  const temp = document.createElement("canvas");
  temp.width = canvas.width; temp.height = canvas.height;
  temp.getContext("2d").drawImage(canvas, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0);
  ctx.restore();

  say(`Background: ${bg}`);
});

// ===== Tools UI =====
function setTool(t) {
  activeTool = t;
  for (const b of [toolDraw, toolText, toolEraser]) b.classList.remove("active");

  if (t === "draw") toolDraw.classList.add("active");
  if (t === "text") toolText.classList.add("active");
  if (t === "eraser") toolEraser.classList.add("active");

  if (t === "stamp") say("Stamp mode: click canvas to place image");
  else say(`Tool: ${t}`);
}

toolDraw.addEventListener("click", () => setTool("draw"));
toolText.addEventListener("click", () => setTool("text"));
toolEraser.addEventListener("click", () => setTool("eraser"));

stampImage.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    pendingStampImage = img;
    setTool("stamp");
    say("Image loaded. Click canvas to place it.");
  };
  img.src = URL.createObjectURL(file);

  // reset input so selecting same file again works
  e.target.value = "";
});

// ===== Input helpers =====
function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
  const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

function line(a, b) {
  const size = parseInt(brushSize.value, 10) || 8;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;

  if (activeTool === "eraser") {
    // Erase by painting with background color (simple + reliable for JPG exports)
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = bg;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = inkColor.value;
  }

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function placeText(x, y) {
  const text = prompt("Text to place:", "hello, hooman.");
  if (!text) return;

  const size = Math.max(8, Math.min(220, parseInt(textSize.value, 10) || 48));
  const ff = font.value || "monospace";

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = inkColor.value;
  ctx.font = `${size}px ${ff}`;
  ctx.textBaseline = "top";

  // subtle readability shadow (tiny, not overdone)
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillText(text, x, y);
  ctx.restore();

  say("Placed text.");
}

function stampAt(x, y) {
  if (!pendingStampImage) {
    say("No stamp image loaded.");
    return;
  }

  // Simple stamp sizing: fit huge images down a bit
  const img = pendingStampImage;
  let w = img.width;
  let h = img.height;

  const maxSide = Math.min(canvas.width, canvas.height) * 0.6;
  const biggest = Math.max(w, h);
  if (biggest > maxSide) {
    const s = maxSide / biggest;
    w = Math.floor(w * s);
    h = Math.floor(h * s);
  }

  const dx = Math.floor(x - w / 2);
  const dy = Math.floor(y - h / 2);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();

  say("Stamped image.");
}

// Mouse / Touch drawing
function onDown(e) {
  const p = getCanvasPos(e);

  if (activeTool === "draw" || activeTool === "eraser") {
    drawing = true;
    last = p;
    line(p, { x: p.x + 0.01, y: p.y + 0.01 });
    return;
  }

  if (activeTool === "text") {
    placeText(p.x, p.y);
    return;
  }

  if (activeTool === "stamp") {
    stampAt(p.x, p.y);
    return;
  }
}

function onMove(e) {
  if (!drawing) return;
  const p = getCanvasPos(e);
  if (last) line(last, p);
  last = p;
}

function onUp() {
  drawing = false;
  last = null;
}

// Pointer events (works for mouse + touch)
canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); onDown(e); });
canvas.addEventListener("pointermove", onMove);
canvas.addEventListener("pointerup", onUp);
canvas.addEventListener("pointercancel", onUp);

// ===== Download =====
function download(type) {
  const link = document.createElement("a");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `jerry-poster-${ts}.${type === "image/png" ? "png" : "jpg"}`;

  if (type === "image/jpeg") {
    // JPEG needs a filled background anyway (we already do).
    link.href = canvas.toDataURL("image/jpeg", 0.92);
  } else {
    link.href = canvas.toDataURL("image/png");
  }

  link.click();
  say(`Downloaded ${type.includes("png") ? "PNG" : "JPG"}.`);
}

btnPNG.addEventListener("click", () => download("image/png"));
btnJPG.addEventListener("click", () => download("image/jpeg"));

btnClear.addEventListener("click", () => {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  say("Cleared.");
});

// ===== New + Import as canvas =====
btnNew.addEventListener("click", () => {
  newModal.style.display = "grid";
});
modalCancel.addEventListener("click", () => {
  newModal.style.display = "none";
});
modalConfirm.addEventListener("click", () => {
  newModal.style.display = "none";
  // reset to preset size
  let w = 1280, h = 720;
  const p = parsePreset(preset.value);
  if (p) { w = p.w; h = p.h; }
  else { w = Math.max(1, parseInt(customW.value || "1280", 10)); h = Math.max(1, parseInt(customH.value || "720", 10)); }
  setCanvasSize(w, h);
});

importAsCanvas.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    bg = "#ffffff";
    bgColor.value = bg;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    say(`Imported as canvas: ${img.width}×${img.height}`);
  };
  img.src = URL.createObjectURL(file);

  e.target.value = "";
});

// ===== Boot =====
(function init() {
  // Start at preset size
  const p = parsePreset(preset.value) || { w: 1080, h: 1080 };
  bg = bgColor.value;
  setCanvasSize(p.w, p.h);
  setTool("draw");
  say("Ready. Draw, place text, stamp images, export.");
})();
