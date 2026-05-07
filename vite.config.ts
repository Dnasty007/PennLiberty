import path from "node:path";
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

export default defineConfig({
  plugins: [react(), ownerChatDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
