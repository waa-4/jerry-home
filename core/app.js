// core/app.js

const TOOLS = [
  {
    name: "Calculator",
    desc: "Fast, clean math helper.",
    href: "./calculator/",
    tag: "Utility",
    glowX: "20%",
    glowY: "20%"
  },
  {
    name: "Gravity Text",
    desc: "Make text fall, bounce, and act goofy.",
    href: "./gravitytext/",
    tag: "Fun",
    glowX: "70%",
    glowY: "10%"
  },
  {
    name: "PaintLab",
    desc: "Draw, doodle, and experiment.",
    href: "./paintlab/",
    tag: "Create",
    glowX: "40%",
    glowY: "30%"
  },
  {
    name: "Translator",
    desc: "Translate text quickly in-browser.",
    href: "./translator/",
    tag: "Language",
    glowX: "65%",
    glowY: "35%"
  },
];

const rail = document.getElementById("toolRail");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

function renderTools(list) {
  rail.innerHTML = "";
  list.forEach((tool, i) => {
    const card = ToolCard(tool);
    rail.appendChild(card);

    // Staggered entrance animation
    setTimeout(() => card.classList.add("ready"), 80 + i * 90);
  });
}

function scrollByCard(dir) {
  // scroll roughly 1 card at a time
  const cardW = 280; // matches --cardW
  const gap = 18;    // matches --gap
  rail.scrollBy({ left: dir * (cardW + gap), behavior: "smooth" });
}

// Buttons
prevBtn.addEventListener("click", () => scrollByCard(-1));
nextBtn.addEventListener("click", () => scrollByCard(1));

// Keyboard support when rail is focused
rail.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") scrollByCard(1);
  if (e.key === "ArrowLeft") scrollByCard(-1);
});

// Drag-to-scroll (mouse)
let isDown = false;
let startX = 0;
let startScrollLeft = 0;

rail.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.pageX;
  startScrollLeft = rail.scrollLeft;
  rail.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  isDown = false;
  rail.style.cursor = "";
});

window.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  const dx = e.pageX - startX;
  rail.scrollLeft = startScrollLeft - dx;
});

// Shuffle
shuffleBtn.addEventListener("click", () => {
  const copy = [...TOOLS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  renderTools(copy);
});

// Initial render
renderTools(TOOLS);

