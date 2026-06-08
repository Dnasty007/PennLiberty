/**
 * Push one rental live: photos (if folder exists) + rentals.json
 *
 *   npm run rentals:publish -- <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getProjectRoot } from "./lib/ftp-deploy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npm run rentals:publish -- <slug>");
  process.exit(1);
}

const root = getProjectRoot();
const rentalsPath = path.join(root, "public", "rentals.json");
const rentals = JSON.parse(fs.readFileSync(rentalsPath, "utf8"));
if (!rentals.some((r) => r.slug === slug)) {
  console.error(`Slug "${slug}" not found in rentals.json — run rentals:add first`);
  process.exit(1);
}

function run(script, args = []) {
  const res = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

const photosDir = path.join(root, "public", "Rentals", slug);
if (fs.existsSync(photosDir) && fs.readdirSync(photosDir).some((f) => fs.statSync(path.join(photosDir, f)).isFile())) {
  run("push-rental-photos.mjs", [slug]);
} else {
  console.log(`No local photos for ${slug} — skipping photo upload`);
}

run("rental-cli.mjs", ["validate"]);
run("push-rentals.mjs");

const rental = rentals.find((r) => r.slug === slug);
console.log(`\nLive: https://pennlibertyre.com/rentals/${slug}`);
console.log(`Title: ${rental?.title ?? slug}`);
