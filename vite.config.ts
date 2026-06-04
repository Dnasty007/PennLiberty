import path from "node:path";
import fs from "node:fs";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function ownerChatDevPlugin(): Plugin {
  return {
    name: "owner-chat-dev",
    apply: "serve",
    configureServer(server) {
      const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        if (req.url !== "/api/owner-chat") {
          next();
          return;
        }

        const chunks: Buffer[] = [];

        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }

        const body = Buffer.concat(chunks).toString("utf-8");
        const url = `http://${req.headers.host ?? "localhost"}${req.url}`;
        const fetchRequest = new Request(url, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: body.length > 0 ? body : undefined,
        });

        const mod = await server.ssrLoadModule("/api/owner-chat.ts");
        const handler = mod.default as (request: Request) => Promise<Response>;
        const response = await handler(fetchRequest);

        res.statusCode = response.status;
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        res.end(await response.text());
      };

      server.middlewares.use(middleware);
    },
  };
}

function devImageSavePlugin(): Plugin {
  return {
    name: "dev-image-save",
    apply: "serve",
    configureServer(server) {
      const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        if (req.url !== "/api/dev/save-image" || req.method !== "POST") {
          next();
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString("utf-8")) as {
            filename: string;
            dataUrl: string;
          };

          // Strip "data:image/...;base64," prefix
          const base64 = body.dataUrl.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64, "base64");

          // Sanitise filename — only allow safe chars
          const safe = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          const dest = path.resolve(__dirname, "public", "backgrounds", safe);

          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buffer);

          const publicPath = `/backgrounds/${safe}`;
          console.log(`[dev-image-save] Saved → ${dest}`);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, path: publicPath }));
        } catch (err) {
          console.error("[dev-image-save] Error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      };

      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), ownerChatDevPlugin(), devImageSavePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
