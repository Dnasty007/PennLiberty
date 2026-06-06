import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "qr-codes");
const SITE_ORIGIN = "https://pennlibertyre.com";

/** Keep in sync with `initialRentals` in src/lib/data.ts */
const rentals = [
  { slug: "1704-w-diamond-st-2f", title: "1704 W Diamond St, Unit 2F" },
  { slug: "1704-w-diamond-st-3f", title: "1704 W Diamond St, Unit 3F" },
  { slug: "2542-cecil-b-moore-ave-2", title: "2542 Cecil B. Moore Ave" },
  { slug: "1540-n-15th-st-3f-rear", title: "1540 N 15th St, 3rd Floor Rear" },
  { slug: "1711-n-gratz-st-2f", title: "1711 N Gratz St, Unit 2F" },
  { slug: "2633-kensington-ave-3", title: "2633 Kensington Ave, Unit 3" },
  { slug: "2633-kensington-ave-1c", title: "2633 Kensington Ave, Unit 1C — Storefront" },
  { slug: "5316-glenloch-st-3f", title: "5316 Glenloch St" },
  { slug: "811-n-15th-st", title: "811 N 15th St" },
];

const targets = [
  {
    slug: "all-rentals",
    title: "All Rentals",
    url: `${SITE_ORIGIN}/rentals`,
  },
  ...rentals.map((rental) => ({
    slug: rental.slug,
    title: rental.title,
    url: `${SITE_ORIGIN}/rentals/${rental.slug}`,
  })),
];

fs.mkdirSync(outDir, { recursive: true });

for (const target of targets) {
  const pngPath = path.join(outDir, `${target.slug}.png`);
  await QRCode.toFile(pngPath, target.url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  console.log(`✓ ${target.slug}.png`);
}

const manifestLines = [
  "Penn Liberty — Rental QR Codes",
  "==============================",
  "",
  "Print-ready PNGs in this folder. Scan-test on your phone after GoDaddy deploy.",
  "",
  ...targets.map(
    (target) =>
      `${target.title}\n  File: ${target.slug}.png\n  URL:  ${target.url}\n`,
  ),
];

fs.writeFileSync(path.join(outDir, "README.txt"), manifestLines.join("\n"));

const htmlCards = targets
  .map(
    (target) => `
    <section class="card">
      <img src="${target.slug}.png" alt="QR code for ${target.title}" width="256" height="256" />
      <h2>${target.title}</h2>
      <p class="url">${target.url}</p>
      <p class="file">${target.slug}.png</p>
    </section>`,
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Penn Liberty Rental QR Codes</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f0; color: #1a1a1a; }
    h1 { margin-bottom: 0.25rem; }
    .intro { max-width: 52rem; margin-bottom: 2rem; color: #444; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .card { background: #fff; border: 1px solid #ddd; border-radius: 12px; padding: 1.25rem; text-align: center; }
    .card h2 { font-size: 1rem; margin: 0.75rem 0 0.35rem; }
    .url, .file { font-size: 0.72rem; color: #666; word-break: break-all; margin: 0.2rem 0; }
    @media print {
      body { background: #fff; margin: 0.5in; }
      .intro { display: none; }
      .card { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Penn Liberty Rental QR Codes</h1>
  <p class="intro">
    <strong>All Rentals</strong> opens the full browse page.
    Each unit QR opens that rental’s detail view directly.
    Do not use the home page URL for signs.
  </p>
  <div class="grid">${htmlCards}</div>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html);

const urlList = targets.map((t) => t.url).join("\n");
fs.writeFileSync(path.join(root, "rental-qr-urls.txt"), [
  "Penn Liberty — Rental QR code URLs",
  "==================================",
  "",
  "ALL RENTALS (browse every unit):",
  targets[0].url,
  "",
  "INDIVIDUAL UNITS (one QR per rental):",
  ...targets.slice(1).map((t) => `${t.url}  — ${t.title}`),
  "",
  "Printable QR images: qr-codes/ folder (run npm run qr:generate to refresh)",
  "",
  "Do NOT use only https://pennlibertyre.com — that goes to the home page.",
  "",
].join("\n"));

console.log(`\nGenerated ${targets.length} QR codes in qr-codes/`);
