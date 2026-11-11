// Serves the built site (dist/) on http://localhost:5174 with no extra packages.
// Use when `npm run dev` can't run:  npm run build  (or copy dist/), then  node serve-dist.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "dist");
const port = Number(process.env.PORT) || 5174;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  let file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(file)).isFile()) throw new Error("dir");
  } catch {
    file = join(root, "index.html"); // single-page app: every route loads index.html
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`CODM site on http://localhost:${port}`));
