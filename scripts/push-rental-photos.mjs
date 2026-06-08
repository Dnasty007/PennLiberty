/**
 * FTP-upload public/Rentals/<slug>/ to GoDaddy.
 *
 *   npm run rentals:push-photos -- <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { getProjectRoot, loadDeployEnv, withFtpClient } from "./lib/ftp-deploy.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npm run rentals:push-photos -- <slug>");
  process.exit(1);
}

const root = getProjectRoot();
const localDir = path.join(root, "public", "Rentals", slug);
if (!fs.existsSync(localDir)) {
  console.error(`Not found: ${localDir}`);
  process.exit(1);
}

const files = fs.readdirSync(localDir).filter((f) => fs.statSync(path.join(localDir, f)).isFile());
if (!files.length) {
  console.error(`No files in ${localDir}`);
  process.exit(1);
}

const { env } = loadDeployEnv(root);

try {
  await withFtpClient(env, async (client, { host, remoteDir }) => {
    const remotePhotosDir = `${remoteDir}/Rentals/${slug}`.replace(/\/+/g, "/");
    await client.ensureDir(remotePhotosDir);
    await client.uploadFromDir(localDir, remotePhotosDir);
    console.log(`Uploaded ${files.length} file(s) → ${host}:${remotePhotosDir}/`);
    for (const f of files) console.log(`  - ${f}`);
  });
} catch (err) {
  console.error("FTP photo upload failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
