/**
 * VerdantNANDA Hub Server with Built-in Zero-Leak AI Gateway Proxy
 * 
 * Serves Hub static files on Port 8080 and handles /api/gateway requests.
 */

import { appendFileSync } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { once } from "node:events";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import gatewayHandler from "../api/gateway.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../hub");

const WORKER_CSP = "default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
};

const port = process.env.PORT || 8080;
const host = "127.0.0.1";

async function isPublicPath(urlPath) {
  if (urlPath === "/agent-manifest.json" ||
      urlPath === "/links.json" ||
      urlPath === "/agent-mcp.json" ||
      urlPath.endsWith(".network.json") ||
      urlPath.startsWith("/nanda/")) {
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${host}:${port}`);
    const urlPath = parsedUrl.pathname;

    // Route /api/gateway to Zero-Leak Proxy
    if (urlPath.startsWith("/api/gateway")) {
      await gatewayHandler(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, HEAD" });
      res.end("Method not allowed");
      return;
    }

    const decoded = decodeURIComponent(urlPath);
    const projectRoot = path.resolve(__dirname, "..");
    let target;

    if (decoded === "/.network.json") {
      target = path.resolve(root, "concierge_negotiator.network.json");
    } else if (decoded.startsWith("/partners/") || decoded.startsWith("/sdk/") || decoded.startsWith("/nanda/")) {
      target = path.resolve(projectRoot, `.${path.sep}${decoded}`);
    } else {
      target = path.resolve(root, `.${path.sep}${decoded}`);
    }

    // Ensure path doesn't escape projectRoot
    if (target !== projectRoot && !target.startsWith(`${projectRoot}${path.sep}`)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(target);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    if (fileStat.isDirectory()) {
      if (!urlPath.endsWith("/")) {
        res.writeHead(301, { Location: `${urlPath}/` });
        res.end();
        return;
      }
      target = path.join(target, "index.html");
    }

    let body;
    try {
      body = await readFile(target);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(target).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(body)
    };

    if (await isPublicPath(urlPath)) {
      headers["Access-Control-Allow-Origin"] = "*";
    }

    if (urlPath === "/runtime/sandbox-worker.js") {
      headers["Content-Security-Policy"] = WORKER_CSP;
    }

    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? "" : body);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error: " + err.message);
    }
  }
});

server.listen(port, host, () => {
  console.log(`Open http://${host}:${port}/ (VerdantNANDA Hub with /api/gateway Proxy)`);
});
