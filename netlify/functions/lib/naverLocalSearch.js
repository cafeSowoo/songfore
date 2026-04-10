const NAVER_LOCAL_SEARCH_URL =
  "https://openapi.naver.com/v1/search/local.json";

function getSearchCredentials() {
  const clientId =
    process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_OPENAPI_CLIENT_ID || "";
  const clientSecret =
    process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_OPENAPI_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_SEARCH_CLIENT_ID or NAVER_SEARCH_CLIENT_SECRET is missing."
    );
  }

  return { clientId, clientSecret };
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseCoordinate(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric / 10000000;
}

export async function searchLocalPlaces(query, { display = 5 } = {}) {
  const trimmedQuery = normalizeWhitespace(query);

  if (!trimmedQuery) {
    return [];
  }

  const { clientId, clientSecret } = getSearchCredentials();
  const url = new URL(NAVER_LOCAL_SEARCH_URL);
  url.searchParams.set("query", trimmedQuery);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret
    }
  });

  if (!response.ok) {
    throw new Error(`Naver local search failed with status ${response.status}`);
  }

  const payload = await response.json();

  return (payload.items || []).map((item, index) => ({
    id: `${normalizeWhitespace(stripHtml(item.title))}:${index}`,
    name: normalizeWhitespace(stripHtml(item.title)),
    address: normalizeWhitespace(item.address || ""),
    roadAddress: normalizeWhitespace(item.roadAddress || ""),
    category: normalizeWhitespace(stripHtml(item.category || "").replace(/>/g, " · ")),
    telephone: normalizeWhitespace(item.telephone || ""),
    link: String(item.link || ""),
    longitude: parseCoordinate(item.mapx),
    latitude: parseCoordinate(item.mapy)
  }));
}
