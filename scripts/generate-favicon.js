// Regenerate public/favicon.png and public/apple-touch-icon.png.
// Run with: node scripts/generate-favicon.js
const path = require("path");
const sharp = require("sharp");

function finderPattern(size) {
  const mid = size * (5 / 7);
  const inner = size * (3 / 7);
  return `
    <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.18}" fill="#1c1c1e" />
    <rect x="${(size - mid) / 2}" y="${(size - mid) / 2}" width="${mid}" height="${mid}" rx="${mid * 0.15}" fill="white" />
    <rect x="${(size - inner) / 2}" y="${(size - inner) / 2}" width="${inner}" height="${inner}" rx="${inner * 0.15}" fill="#1c1c1e" />
  `;
}

async function render(size, outFile) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${finderPattern(size)}</svg>`;
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, "..", "public", outFile));
  console.log("Wrote public/" + outFile);
}

Promise.all([render(64, "favicon.png"), render(180, "apple-touch-icon.png")]).catch((err) => {
  console.error(err);
  process.exit(1);
});
