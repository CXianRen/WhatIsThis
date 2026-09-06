#!/usr/bin/env node
// Dependency-free local preview. Production uses static HTTPS hosting.
import { createServer } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const options = { port: "5000", host: "127.0.0.1", base: "/" };
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  const key = args[index].replace(/^--/, "");
  if (!args[index].startsWith("--") || !(key in options) || !args[index + 1]) {
    throw new Error("Usage: node scripts/serve.mjs [--port 5000] [--host 127.0.0.1] [--base /WhatIsThis/]");
  }
  options[key] = args[index + 1];
}
const port = Number(options.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port.");
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(options.base)) throw new Error("Base path must look like / or /WhatIsThis/.");
const allowed = new Set(["index.html", "manifest.webmanifest", "sw.js", ".nojekyll"]);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Cache-Control", "no-cache");
  const fail = (code, message) => {
    response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : message);
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return fail(405, "Method not allowed");
  }
  let path;
  try {
    path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    return fail(400, "Invalid request path");
  }
  if (options.base !== "/" && path === options.base.slice(0, -1)) {
    response.writeHead(308, { Location: options.base });
    return response.end();
  }
  if (!path.startsWith(options.base)) return fail(404, "Not found");
  const relative = path.slice(options.base.length) || "index.html";
  if (!allowed.has(relative) && !relative.startsWith("static/")) return fail(404, "Not found");
  if (relative.includes("\\") || relative.split("/").some((part) => part === ".." || part === ".")) {
    return fail(404, "Not found");
  }
  try {
    const file = await realpath(resolve(root, relative));
    // Never expose private files through a symlink placed in static/.
    if (!(allowed.has(relative) ? file === resolve(root, relative) : file.startsWith(`${root}${sep}static${sep}`))) {
      return fail(404, "Not found");
    }
    const info = await stat(file);
    if (!info.isFile()) return fail(404, "Not found");
    const body = request.method === "HEAD" ? undefined : await readFile(file);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(file)] || "application/octet-stream",
      "Content-Length": info.size,
    });
    response.end(body);
  } catch {
    fail(404, "Not found");
  }
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, options.host, () => {
  console.log(`AIDict: http://${options.host}:${port}${options.base}`);
});
