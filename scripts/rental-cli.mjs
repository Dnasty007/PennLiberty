/**
 * Simple rental inventory CLI — list / add / remove in public/rentals.json
 *
 *   npm run rentals:list
 *   npm run rentals:remove -- <slug>
 *   npm run rentals:add -- rentals-incoming/new-unit.json
 *   npm run rentals:validate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rentalsPath = path.join(root, "public", "rentals.json");

function readRentals() {
  const raw = fs.readFileSync(rentalsPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("rentals.json must be an array");
  return data;
}

function writeRentals(rentals) {
  fs.writeFileSync(rentalsPath, `${JSON.stringify(rentals, null, 2)}\n`, "utf8");
}

function normalizeRental(entry) {
  const gallery = entry.gallery?.length ? entry.gallery : entry.image ? [entry.image] : [];
  return {
    ...entry,
    gallery,
    image: entry.image || gallery[0] || "",
  };
}

function validateRentals(rentals) {
  const ids = new Set();
  const slugs = new Set();
  for (const r of rentals) {
    if (!r.id || !r.slug || !r.title || !r.price) {
      throw new Error(`Missing required fields (id, slug, title, price) on: ${r.title ?? r.slug ?? "?"}`);
    }
    if (ids.has(r.id)) throw new Error(`Duplicate id: ${r.id}`);
    if (slugs.has(r.slug)) throw new Error(`Duplicate slug: ${r.slug}`);
    ids.add(r.id);
    slugs.add(r.slug);
  }
}

function cmdList(rentals) {
  if (!rentals.length) {
    console.log("No rentals in inventory.");
    return;
  }
  console.log(`${rentals.length} rental(s):\n`);
  for (const r of rentals) {
    console.log(`  [${r.id}] ${r.slug}`);
    console.log(`      ${r.title} — ${r.price} (${r.status ?? "—"})`);
  }
}

function cmdRemove(rentals, slug) {
  const before = rentals.length;
  const next = rentals.filter((r) => r.slug !== slug);
  if (next.length === before) {
    throw new Error(`No rental found with slug "${slug}"`);
  }
  writeRentals(next);
  console.log(`Removed "${slug}". ${next.length} rental(s) remaining.`);
}

function cmdAdd(rentals, filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const entry = normalizeRental(JSON.parse(fs.readFileSync(abs, "utf8")));
  if (!entry.slug || !entry.title || !entry.price) {
    throw new Error("New rental needs at least slug, title, and price");
  }
  if (rentals.some((r) => r.slug === entry.slug)) {
    throw new Error(`Slug already exists: ${entry.slug}`);
  }

  if (!entry.id) {
    entry.id = Math.max(0, ...rentals.map((r) => r.id)) + 1;
  }
  if (rentals.some((r) => r.id === entry.id)) {
    throw new Error(`id ${entry.id} already in use — pick another or omit id to auto-assign`);
  }

  const next = [...rentals, entry];
  validateRentals(next);
  writeRentals(next);
  console.log(`Added "${entry.title}" (slug: ${entry.slug}, id: ${entry.id}).`);
  console.log(`Live URL: /rentals/${entry.slug}`);
}

function usage() {
  console.log(`Usage:
  npm run rentals:list
  npm run rentals:remove -- <slug>
  npm run rentals:add -- rentals-incoming/your-unit.json
  npm run rentals:validate

Or ask Cursor: "Remove Glenloch from rentals and push live."`);
}

const [,, command, arg] = process.argv;

try {
  const rentals = readRentals();

  switch (command) {
    case "list":
      cmdList(rentals);
      break;
    case "remove":
      if (!arg) throw new Error("Pass a slug: npm run rentals:remove -- <slug>");
      cmdRemove(rentals, arg);
      break;
    case "add":
      if (!arg) throw new Error("Pass a JSON file: npm run rentals:add -- rentals-incoming/unit.json");
      cmdAdd(rentals, arg);
      break;
    case "validate":
      validateRentals(rentals.map(normalizeRental));
      console.log(`OK — ${rentals.length} rental(s), valid JSON.`);
      break;
    default:
      usage();
      process.exit(command ? 1 : 0);
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
