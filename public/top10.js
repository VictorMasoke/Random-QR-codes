const list = document.getElementById("leaderboard");

const RARITY_CLASS = {
  Common: "rarity-common",
  Rare: "rarity-rare",
  Epic: "rarity-epic",
  Legendary: "rarity-legendary",
};

async function loadTop10() {
  const res = await fetch("/api/top10");
  const top = await res.json();

  if (!top.length || top.every((t) => t.count === 0)) {
    list.innerHTML = `<li class="empty-state" style="display:block;border:none;background:none;">No votes yet — go discover something and vote for your favorite.</li>`;
    return;
  }

  list.innerHTML = top
    .map((site, i) => {
      const rank = String(i + 1).padStart(2, "0");
      const rarityClass = RARITY_CLASS[site.rarity] || "";
      return `
        <li>
          <span class="rank">${rank}</span>
          <img src="${site.qr}" alt="Mystery QR code #${site.code}" />
          <div class="entry-info">
            <div class="tags">
              <span class="tag tag-vibe">${site.vibe}</span>
              <span class="tag tag-rarity ${rarityClass}">${site.rarity}</span>
            </div>
            <div class="entry-code">Mystery #${site.code}</div>
          </div>
          <span class="entry-count">${site.count} votes</span>
        </li>
      `;
    })
    .join("");
}

loadTop10();
