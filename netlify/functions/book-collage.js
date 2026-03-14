const ALLOWED_ORIGINS = new Set([
  "https://songfore.com",
  "https://www.songfore.com",
  "http://localhost:8888",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:8888",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
]);

const rateMap = new Map();

function isRateLimited(ip, limit = 40, windowMs = 60_000) {
  const now = Date.now();
  const key = ip || "unknown";
  const item = rateMap.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > item.resetAt) {
    item.count = 0;
    item.resetAt = now + windowMs;
  }

  item.count += 1;
  rateMap.set(key, item);
  return item.count > limit;
}

function corsHeaders(origin, extra = {}) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
    ...extra,
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function readAladinKey() {
  return (
    process.env.ALADIN_TTB_KEY ||
    process.env.ALADIN_TTBKEY ||
    process.env.ALADIN_API_KEY ||
    ""
  ).trim();
}

function decodeXmlText(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function extractXmlTag(xml, tagName) {
  const match = String(xml || "").match(
    new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"),
  );
  return decodeXmlText(match?.[1] || "");
}

function parseAladinXml(xmlText) {
  const itemBlocks = String(xmlText || "").match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return itemBlocks
    .map((item) => ({
      itemId: extractXmlTag(item, "itemId"),
      title: extractXmlTag(item, "title"),
      author: extractXmlTag(item, "author"),
      publisher: extractXmlTag(item, "publisher"),
      pubDate: extractXmlTag(item, "pubDate"),
      description: extractXmlTag(item, "description"),
      isbn: extractXmlTag(item, "isbn"),
      isbn13: extractXmlTag(item, "isbn13"),
      link: extractXmlTag(item, "link"),
      cover: extractXmlTag(item, "cover"),
      categoryName: extractXmlTag(item, "categoryName"),
      customerReviewRank: Number.parseInt(extractXmlTag(item, "customerReviewRank"), 10) || 0,
      salesPoint: Number.parseInt(extractXmlTag(item, "salesPoint"), 10) || 0,
    }))
    .filter((item) => item.title && item.cover);
}

function isAllowedImageHost(url) {
  return (
    url.hostname === "image.aladin.co.kr" ||
    url.hostname === "www.aladin.co.kr" ||
    url.hostname.endsWith(".aladin.co.kr")
  );
}

async function handleSearch(body, headers) {
  const ttbKey = readAladinKey();
  if (!ttbKey) {
    return jsonResponse(
      { error: "Missing ALADIN_TTB_KEY" },
      500,
      headers,
    );
  }

  const query = (body?.query || body?.q || "").trim();
  if (!query) {
    return jsonResponse({ error: "Missing query" }, 400, headers);
  }

  const url =
    "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx" +
    `?ttbkey=${encodeURIComponent(ttbKey)}` +
    `&Query=${encodeURIComponent(query)}` +
    "&QueryType=Keyword" +
    "&SearchTarget=Book" +
    "&MaxResults=12" +
    "&Start=1" +
    "&Output=xml" +
    "&Version=20131101" +
    "&Cover=Big";

  try {
    const response = await fetch(url);
    const xmlText = await response.text();

    if (!response.ok) {
      return jsonResponse(
        { error: `Aladin request failed (${response.status})` },
        response.status,
        headers,
      );
    }

    const items = parseAladinXml(xmlText);
    return jsonResponse({ items }, 200, headers);
  } catch (error) {
    return jsonResponse(
      { error: String(error?.message || error) },
      502,
      headers,
    );
  }
}

async function handleCoverProxy(req, headers) {
  const requestUrl = new URL(req.url);
  const target = (requestUrl.searchParams.get("url") || "").trim();

  if (!target) {
    return jsonResponse({ error: "Missing url" }, 400, headers);
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return jsonResponse({ error: "Invalid url" }, 400, headers);
  }

  if (!isAllowedImageHost(targetUrl)) {
    return jsonResponse({ error: "Blocked host" }, 403, headers);
  }

  try {
    const response = await fetch(targetUrl.toString());
    if (!response.ok) {
      return jsonResponse(
        { error: `Image request failed (${response.status})` },
        response.status,
        headers,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return jsonResponse({ error: "Target is not an image" }, 415, headers);
    }

    const bytes = await response.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: corsHeaders(req.headers.get("origin") || "", {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      }),
    });
  } catch (error) {
    return jsonResponse(
      { error: String(error?.message || error) },
      502,
      headers,
    );
  }
}

export default async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Forbidden origin" }, 403, headers);
  }

  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for") ||
    "";
  if (isRateLimited(String(ip))) {
    return jsonResponse({ error: "Too many requests" }, 429, headers);
  }

  const requestUrl = new URL(req.url);
  const action = (requestUrl.searchParams.get("action") || "").trim();

  if (req.method === "GET" && action === "cover") {
    return handleCoverProxy(req, headers);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405, headers);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, headers);
  }

  if ((body?.action || "").trim() === "search") {
    return handleSearch(body, headers);
  }

  return jsonResponse({ error: "Unknown action" }, 400, headers);
};
