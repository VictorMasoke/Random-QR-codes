// Regenerate public/og-image.png. Run with: node scripts/generate-og-image.js
const path = require("path");
const sharp = require("sharp");

const WIDTH = 1200;
const HEIGHT = 630;

function finderPattern(cx, cy, size, color) {
  const outer = size;
  const mid = size * (5 / 7);
  const inner = size * (3 / 7);
  return `
    <rect x="${cx - outer / 2}" y="${cy - outer / 2}" width="${outer}" height="${outer}" fill="${color}" />
    <rect x="${cx - mid / 2}" y="${cy - mid / 2}" width="${mid}" height="${mid}" fill="white" />
    <rect x="${cx - inner / 2}" y="${cy - inner / 2}" width="${inner}" height="${inner}" fill="${color}" />
  `;
}

function scatterDots() {
  const colors = ["#0a84ff", "#af52de", "#ff9f0a", "#1c1c1e"];
  const dots = [];
  const cols = 14;
  const rows = 7;
  const cellW = WIDTH / cols;
  const cellH = HEIGHT / rows;
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.86) {
        const cx = c * cellW + cellW / 2;
        const cy = r * cellH + cellH / 2;
        const size = 10 + rand() * 10;
        const color = colors[Math.floor(rand() * colors.length)];
        dots.push(`<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" rx="3" fill="${color}" opacity="0.16" />`);
      }
    }
  }
  return dots.join("\n");
}

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" />
  ${scatterDots()}

  ${finderPattern(120, 120, 88, "#1c1c1e")}
  ${finderPattern(WIDTH - 120, 120, 88, "#1c1c1e")}
  ${finderPattern(120, HEIGHT - 120, 88, "#1c1c1e")}

  <text x="${WIDTH / 2}" y="290" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="96" fill="#1c1c1e">
    Somewhere, at random.
  </text>
  <text x="${WIDTH / 2}" y="350" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#6e6e73">
    Scan a mystery QR code. Vote for your favorite.
  </text>

  <g>
    <rect x="${WIDTH / 2 - 250}" y="410" width="120" height="34" rx="17" fill="#0a84ff" />
    <text x="${WIDTH / 2 - 190}" y="433" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="white">RARE</text>

    <rect x="${WIDTH / 2 - 115}" y="410" width="130" height="34" rx="17" fill="#af52de" />
    <text x="${WIDTH / 2 - 50}" y="433" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="white">EPIC</text>

    <rect x="${WIDTH / 2 + 30}" y="410" width="220" height="34" rx="17" fill="#ff9f0a" />
    <text x="${WIDTH / 2 + 140}" y="433" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="white">LEGENDARY</text>
  </g>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(__dirname, "..", "public", "og-image.png"))
  .then(() => console.log("Wrote public/og-image.png"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
