/**
 * Upload dist/ to GoDaddy via FTP (full site deploy).
 * Run: npm run build && npm run site:deploy
 */
import fs from "node:fs";
import path from "node:path";
import { getProjectRoot, loadDeployEnv, withFtpClient } from "./lib/ftp-deploy.mjs";

const root = getProjectRoot();
const distDir = path.join(root, "dist");

if (!fs.existsSync(distDir)) {
  console.error(`Missing ${distDir} — run npm run build first`);
  process.exit(1);
}

const { env } = loadDeployEnv(root);

try {
  await withFtpClient(env, async (client, { host, remoteDir }) => {
    const remote = remoteDir.replace(/\/+$/, "") || "/";
    console.log(`Uploading dist/ → ${host}:${remote}/ …`);
    await client.ensureDir(remote);
    await client.uploadFromDir(distDir, remote);
    console.log("Site deployed. Hard refresh https://pennlibertyre.com to verify.");
  });
} catch (err) {
  console.error("FTP upload failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
