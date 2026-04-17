import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const port = Number(process.env.PORT || 4173);
const functionDir = path.join(rootDir, "netlify", "functions");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

await loadLocalEnv();

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = cleanPath === "/" ? "/index.html" : cleanPath;
  return path.join(rootDir, candidate);
}

async function loadLocalEnv() {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(rootDir, fileName);
    const source = await readFile(filePath, "utf8").catch(() => "");

    if (!source) {
      continue;
    }

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex < 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      process.env[key] = value;
    }
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function handleFunctionRequest(request, response) {
  const pathname = decodeURIComponent((request.url || "/").split("?")[0]);
  const functionName = pathname.replace(/^\/\.netlify\/functions\//, "").replace(/\/+$/, "");
  const entryFile = path.join(functionDir, `${functionName}.js`);
  const fileStat = await stat(entryFile).catch(() => null);

  if (!fileStat?.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Function not found");
    return true;
  }

  const moduleUrl = `${pathToFileURL(entryFile).href}?t=${fileStat.mtimeMs}`;
  const functionModule = await import(moduleUrl);
  const handler = functionModule.default;

  if (typeof handler !== "function") {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Function handler is missing");
    return true;
  }

  const body = await readRequestBody(request);
  const url = new URL(request.url || "/", `http://${request.headers.host || `127.0.0.1:${port}`}`);
  const webRequest = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: body.length > 0 ? body : undefined
  });

  const result = await handler(webRequest, {});
  const headers = Object.fromEntries(result.headers.entries());
  const payload = Buffer.from(await result.arrayBuffer());

  response.writeHead(result.status || 200, headers);
  response.end(payload);
  return true;
}

const server = http.createServer(async (request, response) => {
  try {
    if ((request.url || "").startsWith("/.netlify/functions/")) {
      await handleFunctionRequest(request, response);
      return;
    }

    const requestedPath = resolvePath(request.url || "/");
    let filePath = requestedPath;

    const fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    await access(filePath);

    const ext = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Static server running at http://127.0.0.1:${port}`);
});
