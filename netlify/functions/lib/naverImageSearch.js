const NAVER_IMAGE_SEARCH_URL =
  "https://openapi.naver.com/v1/search/image.json";

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

function pickSafeImageUrl(link, thumbnail) {
  const normalizedLink = String(link || "").trim();
  const normalizedThumbnail = String(thumbnail || "").trim();

  if (normalizedLink.startsWith("https://")) {
    return normalizedLink;
  }

  if (normalizedThumbnail.startsWith("https://")) {
    return normalizedThumbnail;
  }

  return normalizedLink || normalizedThumbnail;
}

export async function searchPlaceImages(query, { display = 6 } = {}) {
  const trimmedQuery = normalizeWhitespace(query);

  if (!trimmedQuery) {
    return [];
  }

  const { clientId, clientSecret } = getSearchCredentials();
  const url = new URL(NAVER_IMAGE_SEARCH_URL);
  url.searchParams.set("query", trimmedQuery);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret
    }
  });

  if (!response.ok) {
    throw new Error(`Naver image search failed with status ${response.status}`);
  }

  const payload = await response.json();

  return (payload.items || []).map((item, index) => ({
    id: `${normalizeWhitespace(stripHtml(item.title))}:${index}`,
    title: normalizeWhitespace(stripHtml(item.title)) || "대표사진 후보",
    imageUrl: pickSafeImageUrl(item.link, item.thumbnail),
    thumbnailUrl: pickSafeImageUrl(item.thumbnail, item.link),
    sizeWidth: Number(item.sizewidth) || null,
    sizeHeight: Number(item.sizeheight) || null
  }));
}
