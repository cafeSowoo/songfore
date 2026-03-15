import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8787;

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function normalizeAladinProductUrl(input) {
  const parsed = new URL(String(input || "").trim());
  const isAladinHost = /(^|\.)aladin\.co\.kr$/i.test(parsed.hostname);
  const isProductPage = parsed.pathname === "/shop/wproduct.aspx";

  if (!isAladinHost || !isProductPage) {
    throw new Error("알라딘 상품 상세 페이지 URL만 지원합니다.");
  }

  const itemId = parsed.searchParams.get("ItemId");
  const isbn = parsed.searchParams.get("ISBN");

  if (itemId) {
    return `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${encodeURIComponent(itemId)}`;
  }

  if (isbn) {
    return `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`;
  }

  throw new Error("ItemId 또는 ISBN 파라미터가 필요합니다.");
}

function extractCandidates(html) {
  const candidates = [];

  const copyUrlMatch = html.match(/id=["']copyUrl["'][^>]*value=["'](http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+)["']/i);
  if (copyUrlMatch?.[1]) {
    candidates.push({ url: decodeHtml(copyUrlMatch[1]), source: "share-layer" });
  }

  const shortlinkMetaMatch = html.match(/<link[^>]+rel=["']shortlink["'][^>]+href=["'](http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+)["']/i);
  if (shortlinkMetaMatch?.[1]) {
    candidates.push({ url: decodeHtml(shortlinkMetaMatch[1]), source: "shortlink-meta" });
  }

  const allMatches = [...html.matchAll(/http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+/gi)].map((match) => match[0]);
  for (const url of allMatches) {
    candidates.push({ url, source: "html-match" });
  }

  const unique = [];
  const seen = new Set();
  for (const entry of candidates) {
    if (!entry?.url || seen.has(entry.url)) continue;
    seen.add(entry.url);
    unique.push(entry);
  }

  return unique;
}

function pickBestCandidate(candidates) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const shareLayerCandidate = candidates.find((entry) => entry.source === "share-layer");
  if (shareLayerCandidate) {
    return shareLayerCandidate;
  }

  const sortedByCodeLength = [...candidates].sort((a, b) => {
    const aCode = a.url.split("/p/")[1] || "";
    const bCode = b.url.split("/p/")[1] || "";
    return aCode.length - bCode.length;
  });

  return sortedByCodeLength[0] || null;
}

async function handleShortlinkLookup(productUrl) {
  const normalizedUrl = normalizeAladinProductUrl(productUrl);
  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SongforeShortlinkLocalTest/1.0)",
    },
  });

  const html = await response.text();
  if (!response.ok) {
    throw new Error(`알라딘 요청 실패 (${response.status})`);
  }

  const candidates = extractCandidates(html);
  const best = pickBestCandidate(candidates);
  if (!best) {
    throw new Error("단축 URL을 찾지 못했습니다.");
  }

  return {
    productUrl: normalizedUrl,
    shortUrl: best.url,
    source: best.source,
    candidates,
  };
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await readFile(path.join(__dirname, "index.html"), "utf8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(html);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/aladin-shortlink") {
      const rawBody = await readRequestBody(req);
      let body;

      try {
        body = JSON.parse(rawBody || "{}");
      } catch {
        sendJson(res, 400, { error: "Invalid JSON" });
        return;
      }

      try {
        const result = await handleShortlinkLookup(body?.url || "");
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, { error: String(error?.message || error) });
      }
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  } catch (error) {
    sendJson(res, 500, { error: String(error?.message || error) });
  }
});

server.listen(PORT, () => {
  console.log(`Aladin shortlink test server running at http://localhost:${PORT}`);
});
