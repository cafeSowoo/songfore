import { json } from "./lib/http.js";
import { searchPlaceImages } from "./lib/naverImageSearch.js";

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildImageQueries(name, address) {
  const normalizedName = normalizeWhitespace(name);
  const normalizedAddress = normalizeWhitespace(address);
  const variants = [normalizedName];

  if (normalizedName && normalizedAddress) {
    variants.push(`${normalizedName} ${normalizedAddress}`);
    variants.push(`${normalizedName} ${normalizedAddress.split(" ").slice(0, 3).join(" ")}`);
  }

  return [...new Set(variants.filter(Boolean))];
}

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const name = normalizeWhitespace(url.searchParams.get("name"));
    const address = normalizeWhitespace(url.searchParams.get("address"));

    if (!name) {
      return json({ suggestions: [] });
    }

    const collected = [];
    const seen = new Set();

    for (const query of buildImageQueries(name, address)) {
      const results = await searchPlaceImages(query, { display: 6 });

      for (const item of results) {
        if (!item.imageUrl || seen.has(item.imageUrl)) {
          continue;
        }

        seen.add(item.imageUrl);
        collected.push(item);

        if (collected.length >= 6) {
          break;
        }
      }

      if (collected.length >= 6) {
        break;
      }
    }

    return json({ suggestions: collected });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search place images.";

    return json(
      {
        error:
          message.includes("NAVER_SEARCH_CLIENT_ID")
            ? "네이버 이미지 검색 키가 없어 사진 후보를 불러올 수 없습니다."
            : message
      },
      { status: 500 }
    );
  }
};
