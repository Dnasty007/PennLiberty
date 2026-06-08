import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "basic-ftp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getProjectRoot() {
  return path.resolve(__dirname, "..", "..");
}

export function loadDeployEnv(root = getProjectRoot()) {
  const envPath = path.join(root, ".env.deploy");
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath} — copy .env.deploy.example and fill in FTP credentials`);
  }
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return { env: out, envPath };
}

export function getFtpSettings(env) {
  const host = env.GODADDY_FTP_HOST;
  const user = env.GODADDY_FTP_USER;
  const password = env.GODADDY_FTP_PASSWORD;
  const remoteDir = env.GODADDY_FTP_REMOTE_DIR || "/public_html";
  const secure = env.GODADDY_FTP_SECURE === "true";
  const port = env.GODADDY_FTP_PORT ? Number(env.GODADDY_FTP_PORT) : undefined;
  if (!host || !user || !password) {
    throw new Error("GODADDY_FTP_HOST, GODADDY_FTP_USER, and GODADDY_FTP_PASSWORD are required in .env.deploy");
  }
  return { host, user, password, remoteDir, secure, port };
}

export async function withFtpClient(env, fn) {
  const settings = getFtpSettings(env);
  const client = new Client(120_000);
  client.ftp.verbose = false;
  try {
    await client.access({
      host: settings.host,
      user: settings.user,
      password: settings.password,
      secure: settings.secure,
      port: settings.port,
    });
    return await fn(client, settings);
  } finally {
    client.close();
  }
}
