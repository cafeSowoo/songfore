// netlify/functions/book-recommend.js
// Gemini API 키를 서버에서만 사용 (브라우저 노출 없음)

const ALLOWED_ORIGINS = new Set([
  "https://songfore.com",
  "https://www.songfore.com",
  // 로컬 테스트용
  "http://localhost:8888",
  "http://localhost:5173",
  "http://localhost:3000",
]);

// 간단한 인메모리 레이트리밋 (1분당 IP당 20회 제한)
const rateMap = new Map();

/**
 * @param {string} ip
 * @param {number} limit
 * @param {number} windowMs
 */
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
  // origin이 허용 목록이면 허용, 아니면 빈 값(브라우저 차단)
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

// Gemini 모델 순서 (할당량 초과 시 자동 폴백)
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

export default async (req, context) => {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // CORS origin 체크
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // IP 기반 레이트리밋
  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for") ||
    "";
  if (isRateLimited(String(ip))) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const prompt = (body?.prompt || "").trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Gemini 모델을 순서대로 시도
  let lastError = "Unknown error";
  for (const modelId of GEMINI_MODELS) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${modelId}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    let r;
    try {
      r = await fetch(url, {
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
    } catch (e) {
      lastError = String(e?.message || e);
      continue; // 네트워크 오류 → 다음 모델
    }

    // 할당량 초과 → 다음 모델
    if (r.status === 429 || r.status === 503) {
      lastError = `Quota exceeded (${modelId})`;
      continue;
    }

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      const msg = data?.error?.message || "";
      if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        lastError = msg;
        continue; // 할당량 초과 → 다음 모델
      }
      // 기타 오류 → 즉시 반환
      return new Response(
        JSON.stringify({ error: msg || `Gemini error (${r.status})` }),
        {
          status: r.status,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      lastError = "Empty response from Gemini";
      continue;
    }

    return new Response(JSON.stringify({ text, model: modelId }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // 모든 모델 실패
  return new Response(JSON.stringify({ error: lastError }), {
    status: 502,
    headers: { ...headers, "Content-Type": "application/json" },
  });
};
