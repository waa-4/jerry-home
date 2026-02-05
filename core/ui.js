// core/ui.js

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;

  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  return node;
}

function ToolCard(tool) {
  const card = el("article", "toolcard");
  card.style.setProperty("--gx", tool.glowX || "30%");
  card.style.setProperty("--gy", tool.glowY || "20%");

  const inner = el("div", "card-inner");

  inner.appendChild(el("div", "badge", { text: tool.tag || "Tool" }));
  inner.appendChild(el("h2", "card-title", { text: tool.name }));
  inner.appendChild(el("p", "card-desc", { text: tool.desc }));

  inner.appendChild(el("div", "card-spacer"));

  const cta = el("a", "card-cta", { href: tool.href });
  cta.appendChild(el("div", "", { html: `<strong>Open</strong><br><small>${tool.href}</small>` }));
  cta.appendChild(el("div", "", { html: `<span aria-hidden="true">↗</span>` }));

  inner.appendChild(cta);
  card.appendChild(inner);

  // Subtle “mousemove glow” effect
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--gx", x.toFixed(1) + "%");
    card.style.setProperty("--gy", y.toFixed(1) + "%");
  });

  return card;
}

