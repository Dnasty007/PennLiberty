/**
 * Upload inspection PDF + email crown logos to GoDaddy (production).
 * Does not full-site deploy. Requires .env.deploy
 */
import fs from "node:fs";
import path from "node:path";
import { getProjectRoot, loadDeployEnv, withFtpClient } from "./lib/ftp-deploy.mjs";

const root = getProjectRoot();
const { env } = loadDeployEnv(root);

const files = [
  {
    local: path.join(root, "public", "owners", "inspection-program.pdf"),
    remoteParts: ["owners", "inspection-program.pdf"],
  },
  {
    local: path.join(root, "public", "brand", "crown-navy.png"),
    remoteParts: ["brand", "crown-navy.png"],
  },
  {
    local: path.join(root, "public", "brand", "crown-cream.png"),
    remoteParts: ["brand", "crown-cream.png"],
  },
];

for (const f of files) {
  if (!fs.existsSync(f.local)) {
    console.error("Missing local file:", f.local);
    process.exit(1);
  }
}

try {
  await withFtpClient(env, async (client, { host }) => {
    console.log(`FTP ${host}`);
    // Production site root is FTP "/" (public_html home for this account)
    await client.cd("/owners");
    const pdf = files[0];
    console.log(`Uploading ${path.relative(root, pdf.local)} → /owners/inspection-program.pdf`);
    await client.uploadFrom(pdf.local, "inspection-program.pdf");

    await client.cd("/");
    await client.ensureDir("/brand");
    await client.cd("/brand");
    console.log(`Uploading crowns → /brand/`);
    await client.uploadFrom(files[1].local, "crown-navy.png");
    await client.uploadFrom(files[2].local, "crown-cream.png");

    console.log("Done. Verify https://www.pennlibertyre.com/owners/inspection-program.pdf");
  });
} catch (err) {
  console.error("FTP failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
