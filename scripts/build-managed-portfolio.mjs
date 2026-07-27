/**
 * Rebuild src/data/managed-portfolio.json from vault exports.
 *
 * Usage (from repo root), optional vault path:
 *   node scripts/build-managed-portfolio.mjs
 *   node scripts/build-managed-portfolio.mjs "C:/Users/.../PennLiberty-Brain/50 Properties"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const defaultVault = path.resolve(
  process.env.USERPROFILE || process.env.HOME || "",
  "Documents/PennLiberty-Brain/50 Properties",
);
const vaultDir = process.argv[2] || defaultVault;

function normalize(s) {
  let t = String(s || "")
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  t = ` ${t} `;
  const reps = {
    " st ": " street ",
    " ave ": " avenue ",
    " rd ": " road ",
    " blvd ": " boulevard ",
    " dr ": " drive ",
    " ln ": " lane ",
    " ct ": " court ",
    " pl ": " place ",
    " e ": " east ",
    " w ": " west ",
    " n ": " north ",
    " s ": " south ",
  };
  for (const [a, b] of Object.entries(reps)) t = t.split(a).join(b);
  return t.replace(/\s+/g, " ").trim();
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function uniq(seq) {
  const seen = new Set();
  const out = [];
  for (const x of seq) {
    const k = String(x).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((a, b) => a.length - b.length || a.localeCompare(b));
}

const propsPath = path.join(vaultDir, "properties.json");
const unitsPath = path.join(vaultDir, "Unit_details.csv");
if (!fs.existsSync(propsPath) || !fs.existsSync(unitsPath)) {
  console.error("Missing vault files in", vaultDir);
  process.exit(1);
}

const props = JSON.parse(fs.readFileSync(propsPath, "utf8").replace(/^\uFEFF/, ""));
const unitRows = parseCsv(fs.readFileSync(unitsPath, "utf8"));
const byBuilding = new Map();
const byRental = new Map();

for (const row of unitRows) {
  const un = String(row.UnitNumber || "").trim();
  if (!un) continue;
  const bid = String(row.BuildingId || "").trim();
  const rn = String(row.RentalName || "").trim().toLowerCase();
  if (bid) {
    if (!byBuilding.has(bid)) byBuilding.set(bid, []);
    byBuilding.get(bid).push(un);
  }
  if (rn) {
    if (!byRental.has(rn)) byRental.set(rn, []);
    byRental.get(rn).push(un);
  }
}

const portfolio = [];
for (const p of props) {
  const pid = String(p.PropertyId || "").trim();
  const street = String(p.Address || p.PropertyName || "").trim();
  if (!street) continue;
  const city = String(p.City || "Philadelphia").trim();
  const state = String(p.State || "PA").trim();
  const zip = String(p.Zip || "").trim();
  const units = uniq([
    ...(byBuilding.get(pid) || []),
    ...(byRental.get(String(p.PropertyName || "").trim().toLowerCase()) || []),
  ]);
  const unitCount = Number(p.Units) || units.length || 1;
  const formatted = `${street}, ${city}, ${state} ${zip}`.replace(/\s+/g, " ").trim();
  const emails = String(p.OwnerEmail || "")
    .split(/[;,]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  portfolio.push({
    id: pid,
    street,
    city,
    state,
    zip,
    formatted,
    units,
    unitCount,
    subType: p.SubType || "",
    ownerName: p.OwnerNames || p.OwnerName || "",
    ownerEmails: emails,
    search: normalize(`${street} ${city} ${state} ${zip}`),
  });
}

portfolio.sort((a, b) => a.street.localeCompare(b.street));
const payload = {
  asOf: new Date().toISOString().slice(0, 10),
  source: "PennLiberty-Brain/50 Properties properties.json + Unit_details.csv",
  count: portfolio.length,
  properties: portfolio,
};

const outDir = path.join(root, "src", "data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "managed-portfolio.json");
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outPath} (${portfolio.length} properties)`);
