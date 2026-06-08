/** Dev-only: try common GoDaddy FTP login combos (no secrets logged). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(path.resolve(__dirname, ".."), ".env.deploy");

function loadEnv(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv(envPath);
const password = env.GODADDY_FTP_PASSWORD;
const hosts = [
  env.GODADDY_FTP_HOST,
  "ftp.pennlibertyre.com",
  "pennlibertyre.com",
  "p3plzcpnl504479.prod.phx3.secureserver.net",
].filter(Boolean);
const users = [
  env.GODADDY_FTP_USER,
  `${env.GODADDY_FTP_USER}@pennlibertyre.com`,
  "rentals-push@pennlibertyre.com",
].filter(Boolean);

const tries = [];
for (const host of [...new Set(hosts)]) {
  for (const user of [...new Set(users)]) {
    tries.push({ host, user, secure: false });
    tries.push({ host, user, secure: true });
  }
}

for (const t of tries) {
  const client = new Client(10_000);
  try {
    await client.access({ host: t.host, user: t.user, password, secure: t.secure });
    console.log(`OK host=${t.host} user=${t.user} secure=${t.secure}`);
    client.close();
    process.exit(0);
  } catch {
    client.close();
  }
}

console.error("No FTP combo worked. Use cPanel → Configure FTP Client for exact host/user.");
process.exit(1);
