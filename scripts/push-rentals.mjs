/**
 * Upload public/rentals.json to GoDaddy via FTP (one small file — no zip).
 *
 * Setup: copy .env.deploy.example → .env.deploy and fill in FTP credentials.
 */
import fs from "node:fs";
import path from "node:path";
import { getProjectRoot, loadDeployEnv, withFtpClient } from "./lib/ftp-deploy.mjs";

const root = getProjectRoot();
const rentalsPath = path.join(root, "public", "rentals.json");

if (!fs.existsSync(rentalsPath)) {
  console.error(`Not found: ${rentalsPath}`);
  process.exit(1);
}

const { env } = loadDeployEnv(root);

try {
  await withFtpClient(env, async (client, { host, remoteDir }) => {
    await client.ensureDir(remoteDir);
    await client.uploadFrom(rentalsPath, `${remoteDir}/rentals.json`.replace(/\/+/g, "/"));
    console.log(`Uploaded rentals.json → ${host}:${remoteDir}/rentals.json`);
    console.log("Hard refresh https://pennlibertyre.com/rentals to verify.");
  });
} catch (err) {
  console.error("FTP upload failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
