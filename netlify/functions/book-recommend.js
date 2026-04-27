const ALLOWED_ORIGINS = new Set([
  "https://songfore.com",
  "https://www.songfore.com",
  "http://127.0.0.1:4173",
  "http://localhost:8888",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const rateMap = new Map();
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

function isRateLimited(ip, limit = 20, windowMs = 60_000) {
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

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function decodeHtmlText(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
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
  if (itemBlocks.length === 0) {
    return [];
  }

  return itemBlocks.map((item) => ({
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
    mallType: extractXmlTag(item, "mallType"),
    customerReviewRank: Number.parseInt(extractXmlTag(item, "customerReviewRank"), 10) || 0,
    salesPoint: Number.parseInt(extractXmlTag(item, "salesPoint"), 10) || 0,
  }));
}

async function fetchGoogleBooks(query, apiKey) {
  const booksUrl =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
    `&maxResults=20&langRestrict=ko&printType=books&orderBy=relevance&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(booksUrl);
  const data = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function fetchAladinBooks(title, author) {
  const ttbKey = readAladinKey();
  if (!ttbKey) {
    return { enabled: false, items: [], error: "Missing ALADIN_TTB_KEY" };
  }

  const query = [title, author].filter(Boolean).join(" ").trim();
  if (!query) {
    return { enabled: true, items: [] };
  }

  const url =
    "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx" +
    `?ttbkey=${encodeURIComponent(ttbKey)}` +
    `&Query=${encodeURIComponent(query)}` +
    "&QueryType=Keyword" +
    "&SearchTarget=Book" +
    "&MaxResults=10" +
    "&start=1" +
    "&output=xml" +
    "&Version=20131101" +
    "&Cover=Big";

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    if (!response.ok) {
      return {
        enabled: true,
        items: [],
        error: `Aladin request failed (${response.status})`,
      };
    }

    return {
      enabled: true,
      items: parseAladinXml(xmlText),
    };
  } catch (error) {
    return {
      enabled: true,
      items: [],
      error: String(error?.message || error),
    };
  }
}

async function handleBookSearch(body, headers) {
  const booksApiKey = (process.env.GOOGLE_BOOKS_API_KEY || "").trim();
  if (!booksApiKey) {
    return jsonResponse({ error: "Missing GOOGLE_BOOKS_API_KEY" }, 500, headers);
  }

  const query = (body?.q || "").trim();
  const title = (body?.title || "").trim();
  const author = (body?.author || "").trim();
  if (!query) {
    return jsonResponse({ error: "Missing query" }, 400, headers);
  }

  try {
    const [googleResult, aladinResult] = await Promise.all([
      fetchGoogleBooks(query, booksApiKey),
      fetchAladinBooks(title, author),
    ]);

    if (!googleResult.ok) {
      return jsonResponse(googleResult.data, googleResult.status, headers);
    }

    return jsonResponse(
      {
        items: Array.isArray(googleResult.data?.items) ? googleResult.data.items : [],
        totalItems: Number.isFinite(googleResult.data?.totalItems)
          ? googleResult.data.totalItems
          : 0,
        aladin: aladinResult,
      },
      200,
      headers,
    );
  } catch (error) {
    return jsonResponse({ error: String(error?.message || error) }, 502, headers);
  }
}

function normalizeAladinProductUrl(input) {
  const parsed = new URL(String(input || "").trim());
  const isAladinHost = /(^|\.)aladin\.co\.kr$/i.test(parsed.hostname);
  const isProductPage = parsed.pathname === "/shop/wproduct.aspx";

  if (!isAladinHost || !isProductPage) {
    throw new Error("Only Aladin product detail URLs are supported");
  }

  const itemId = parsed.searchParams.get("ItemId");
  const isbn = parsed.searchParams.get("ISBN");

  if (itemId) {
    return `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${encodeURIComponent(itemId)}`;
  }

  if (isbn) {
    return `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${encodeURIComponent(isbn)}`;
  }

  throw new Error("Missing ItemId or ISBN");
}

function extractAladinShortlinkCandidates(html) {
  const candidates = [];

  const copyUrlMatch = html.match(
    /id=["']copyUrl["'][^>]*value=["'](http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+)["']/i,
  );
  if (copyUrlMatch?.[1]) {
    candidates.push({
      url: decodeHtmlText(copyUrlMatch[1]),
      source: "share-layer",
    });
  }

  const shortlinkMetaMatch = html.match(
    /<link[^>]+rel=["']shortlink["'][^>]+href=["'](http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+)["']/i,
  );
  if (shortlinkMetaMatch?.[1]) {
    candidates.push({
      url: decodeHtmlText(shortlinkMetaMatch[1]),
      source: "shortlink-meta",
    });
  }

  const allMatches = [
    ...html.matchAll(/http:\/\/aladin\.kr\/p\/[A-Za-z0-9]+/gi),
  ].map((match) => match[0]);
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

function pickBestAladinShortlink(candidates) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const shareLayerCandidate = candidates.find(
    (entry) => entry.source === "share-layer",
  );
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

async function handleShortlinkLookup(body, headers) {
  const productUrl = normalizeAladinProductUrl(body?.url || "");
  const response = await fetch(productUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SongforeBookRecommend/1.0)",
    },
  });

  const html = await response.text();
  if (!response.ok) {
    return jsonResponse(
      { error: `Aladin request failed (${response.status})`, productUrl },
      response.status,
      headers,
    );
  }

  const candidates = extractAladinShortlinkCandidates(html);
  const best = pickBestAladinShortlink(candidates);
  if (!best) {
    return jsonResponse(
      { error: "Shortlink not found", productUrl, candidates: [] },
      404,
      headers,
    );
  }

  return jsonResponse(
    {
      productUrl,
      shortUrl: best.url,
      source: best.source,
      candidates,
    },
    200,
    headers,
  );
}

async function handleGeminiPrompt(body, headers) {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiApiKey) {
    return jsonResponse({ error: "Missing GEMINI_API_KEY" }, 500, headers);
  }

  const prompt = (body?.prompt || "").trim();
  if (!prompt) {
    return jsonResponse({ error: "Missing prompt" }, 400, headers);
  }

  let lastError = "Unknown error";

  for (const modelId of GEMINI_MODELS) {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${modelId}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
    } catch (error) {
      lastError = String(error?.message || error);
      continue;
    }

    if (response.status === 429 || response.status === 503) {
      lastError = `Quota exceeded (${modelId})`;
      continue;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "";
      if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
        lastError = message;
        continue;
      }
      return jsonResponse(
        { error: message || `Gemini error (${response.status})` },
        response.status,
        headers,
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) {
      lastError = "Empty response from Gemini";
      continue;
    }

    return jsonResponse({ text, model: modelId }, 200, headers);
  }

  return jsonResponse({ error: lastError }, 502, headers);
}

export default async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405, headers);
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

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, headers);
  }

  if (body?.action === "search") {
    return handleBookSearch(body, headers);
  }

  if (body?.action === "shortlink") {
    return handleShortlinkLookup(body, headers);
  }

  return handleGeminiPrompt(body, headers);
};
