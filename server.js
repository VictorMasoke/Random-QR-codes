const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const db = require("./db");
const sites = require("./sites");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sitesById = new Map(sites.map((s) => [s.id, s]));

const VIBES = [
  "🎨 Chaotic Creative",
  "🧪 Weird Science",
  "🕹️ Retro Internet",
  "🌌 Cosmic",
  "🐾 Feral",
  "🎭 Absurd",
  "🎵 Sonic",
  "🧩 Puzzling",
  "🔥 Cursed",
  "✨ Wholesome",
  "🛸 Glitchy",
  "📼 Nostalgic",
  "🌀 Hypnotic",
  "🕳️ Rabbit Hole",
  "🎪 Circus Energy",
  "🧠 Brain Itch",
];

const RARITIES = [
  { name: "Common", chance: 0.5 },
  { name: "Rare", chance: 0.3 },
  { name: "Epic", chance: 0.15 },
  { name: "Legendary", chance: 0.05 },
];

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rollRarity() {
  const r = Math.random();
  let acc = 0;
  for (const tier of RARITIES) {
    acc += tier.chance;
    if (r < acc) return tier.name;
  }
  return "Common";
}

// No name, no URL in the payload — the QR itself is the only way to find out
// where a destination goes. Vibe + code are derived from the id so they stay
// stable for a given mystery site across visits; rarity is rolled fresh each
// time to keep every draw feeling like a loot pull.
async function siteWithQr(site) {
  const qr = await QRCode.toDataURL(site.url, { margin: 1, width: 480 });
  const hash = hashId(site.id);
  return {
    id: site.id,
    qr,
    vibe: VIBES[hash % VIBES.length],
    code: 100 + (hash % 900),
    rarity: rollRarity(),
  };
}

function pickRandomDistinct(count) {
  const pool = [...sites];
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

app.get("/api/random", async (req, res) => {
  const picked = pickRandomDistinct(2);
  res.json(await Promise.all(picked.map(siteWithQr)));
});

app.post("/api/vote", (req, res) => {
  const { id } = req.body || {};
  if (!id || !sitesById.has(id)) {
    return res.status(400).json({ error: "Unknown site id" });
  }
  db.prepare("UPDATE votes SET count = count + 1 WHERE id = ?").run(id);
  const row = db.prepare("SELECT count FROM votes WHERE id = ?").get(id);
  res.json({ id, count: row.count });
});

app.get("/api/top10", async (req, res) => {
  const rows = db
    .prepare("SELECT id, count FROM votes ORDER BY count DESC, id ASC LIMIT 10")
    .all();
  const top = await Promise.all(
    rows
      .filter((r) => sitesById.has(r.id))
      .map(async (r) => ({
        ...(await siteWithQr(sitesById.get(r.id))),
        count: r.count,
      }))
  );
  res.json(top);
});

app.get("/api/stats", (req, res) => {
  const row = db.prepare("SELECT COALESCE(SUM(count), 0) AS total FROM votes").get();
  res.json({ totalVotes: row.total, totalMysteries: sites.length });
});

app.listen(PORT, () => {
  console.log(`Random QR Codes running at http://localhost:${PORT}`);
});
