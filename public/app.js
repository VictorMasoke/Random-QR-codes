const grid = document.getElementById("grid");
const rerollBtn = document.getElementById("rerollBtn");
const statsLine = document.getElementById("statsLine");
const levelName = document.getElementById("levelName");
const levelCount = document.getElementById("levelCount");
const levelFill = document.getElementById("levelFill");
const levelToast = document.getElementById("levelToast");

const RARITY_CLASS = {
  Common: "rarity-common",
  Rare: "rarity-rare",
  Epic: "rarity-epic",
  Legendary: "rarity-legendary",
};

const LEVELS = [
  { name: "Newcomer", min: 0 },
  { name: "Explorer", min: 5 },
  { name: "Voyager", min: 15 },
  { name: "Wanderer", min: 40 },
  { name: "Legend", min: 100 },
  { name: "Mythic", min: 250 },
];

function getRevealed() {
  return Number(localStorage.getItem("qr_revealed") || 0);
}

function levelFor(count) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (count >= lvl.min) current = lvl;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1];
  return { current, next };
}

function renderLevel(count, { animateFill = true } = {}) {
  const { current, next } = levelFor(count);
  levelName.textContent = current.name;
  levelCount.textContent = `${count} mystery${count === 1 ? "" : "ies"} revealed`;

  if (next) {
    const span = next.min - current.min;
    const progress = Math.min(1, (count - current.min) / span);
    levelFill.style.transition = animateFill ? "width 500ms cubic-bezier(0.16,1,0.3,1)" : "none";
    levelFill.style.width = `${progress * 100}%`;
  } else {
    levelFill.style.width = "100%";
  }
}

function bumpRevealed(by) {
  const before = getRevealed();
  const after = before + by;
  localStorage.setItem("qr_revealed", String(after));

  const beforeLevel = levelFor(before).current;
  const afterLevel = levelFor(after).current;
  renderLevel(after);

  if (afterLevel.name !== beforeLevel.name) {
    showToast(`Level up — you're now a ${afterLevel.name} 🎉`);
  }
}

function showToast(text) {
  levelToast.textContent = text;
  levelToast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => levelToast.classList.remove("show"), 2600);
}

function burstConfetti(originEl) {
  const rect = originEl.getBoundingClientRect();
  const colors = ["#0a84ff", "#af52de", "#ff9f0a", "#ff375f", "#30d158"];
  for (let i = 0; i < 14; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top}px`;
    piece.style.background = colors[i % colors.length];
    const angle = (Math.PI / 6) * (Math.random() * 8 - 4);
    const distance = 60 + Math.random() * 70;
    piece.style.setProperty("--dx", `${Math.sin(angle) * distance}px`);
    piece.style.setProperty("--dy", `${-Math.cos(angle) * distance - 40}px`);
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

function cardSkeleton(index) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.index = index;
  card.innerHTML = `
    <div class="qr-frame"><span class="spinner"></span></div>
    <div class="tags">
      <span class="tag tag-vibe">&hellip;</span>
      <span class="tag tag-rarity">&hellip;</span>
    </div>
    <div class="site-hint">Scan with your phone camera to reveal it</div>
    <div class="actions">
      <button class="btn-vote" disabled>Worth the scan 🔥</button>
    </div>
    <div class="vote-count"></div>
  `;
  return card;
}

function renderSite(card, site) {
  const qrFrame = card.querySelector(".qr-frame");
  const vibeTag = card.querySelector(".tag-vibe");
  const rarityTag = card.querySelector(".tag-rarity");
  const voteBtn = card.querySelector(".btn-vote");
  const voteCount = card.querySelector(".vote-count");

  const img = document.createElement("img");
  img.src = site.qr;
  img.alt = `Mystery QR code #${site.code}`;
  img.onload = () => bumpRevealed(1);
  qrFrame.innerHTML = "";
  qrFrame.appendChild(img);

  vibeTag.textContent = site.vibe;
  rarityTag.textContent = site.rarity;
  rarityTag.className = `tag tag-rarity ${RARITY_CLASS[site.rarity] || ""}`;
  voteBtn.disabled = false;
  voteBtn.classList.remove("voted");
  voteBtn.textContent = "Worth the scan 🔥";
  voteCount.textContent = "";

  voteBtn.onclick = async () => {
    voteBtn.disabled = true;
    burstConfetti(voteBtn);
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: site.id }),
    });
    const data = await res.json();
    voteBtn.classList.add("voted");
    voteBtn.textContent = "Voted ✓";
    voteCount.textContent = `${data.count} vote${data.count === 1 ? "" : "s"} so far`;
  };
}

async function loadRandomPair() {
  rerollBtn.disabled = true;
  grid.innerHTML = "";
  grid.appendChild(cardSkeleton(0));
  grid.appendChild(cardSkeleton(1));

  const res = await fetch("/api/random");
  const pair = await res.json();
  const cards = grid.querySelectorAll(".card");

  pair.forEach((site, i) => renderSite(cards[i], site));
  rerollBtn.disabled = false;
}

async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();
    statsLine.textContent = `${data.totalMysteries} mystery destinations in the pool · ${data.totalVotes} votes cast worldwide`;
  } catch {
    statsLine.textContent = "";
  }
}

rerollBtn.addEventListener("click", loadRandomPair);

renderLevel(getRevealed(), { animateFill: false });
loadRandomPair();
loadStats();
