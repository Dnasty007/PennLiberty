/**
 * Copy images from a staging folder into public/Rentals/<slug>/ with standard names.
 *
 *   npm run rentals:stage-photos -- <slug> <source-dir>
 *
 * First image → cover.<ext>, rest → img-2.<ext>, img-3.<ext>, ...
 * Prints gallery paths for the listing JSON.
 */
import fs from "node:fs";
import path from "node:path";
import { getProjectRoot } from "./lib/ftp-deploy.mjs";

const slug = process.argv[2];
const sourceDir = process.argv[3];

if (!slug || !sourceDir) {
  console.error("Usage: npm run rentals:stage-photos -- <slug> <source-dir>");
  process.exit(1);
}

const root = getProjectRoot();
const absSource = path.isAbsolute(sourceDir) ? sourceDir : path.join(root, sourceDir);
if (!fs.existsSync(absSource)) {
  console.error(`Source not found: ${absSource}`);
  process.exit(1);
}

const imageExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]);
const sources = fs
  .readdirSync(absSource)
  .filter((f) => imageExt.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (!sources.length) {
  console.error(`No images in ${absSource}`);
  process.exit(1);
}

const destDir = path.join(root, "public", "Rentals", slug);
fs.mkdirSync(destDir, { recursive: true });

const gallery = [];
for (let i = 0; i < sources.length; i++) {
  const ext = path.extname(sources[i]).toLowerCase() === ".jpeg" ? ".jpg" : path.extname(sources[i]).toLowerCase();
  const destName = i === 0 ? `cover${ext}` : `img-${i + 1}${ext}`;
  fs.copyFileSync(path.join(absSource, sources[i]), path.join(destDir, destName));
  gallery.push(`/Rentals/${slug}/${destName}`);
}

console.log(`Staged ${gallery.length} photo(s) → public/Rentals/${slug}/`);
console.log("Gallery paths (use in rentals JSON):");
for (const g of gallery) console.log(`  ${g}`);
