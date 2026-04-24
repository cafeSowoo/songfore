const NAVER_WEB_SEARCH_URL = "https://search.naver.com/search.naver";

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildQueryVariants(name, address) {
  const normalizedName = normalizeWhitespace(name);
  const normalizedAddress = normalizeWhitespace(address);
  const variants = [];

  if (normalizedName && normalizedAddress) {
    variants.push(`${normalizedName} ${normalizedAddress}`);
    variants.push(
      `${normalizedName} ${normalizedAddress.split(" ").slice(0, 4).join(" ")}`
    );
  }

  if (normalizedName) {
    variants.push(normalizedName);
    variants.push(`${normalizedName} 대전`);
  }

  return [...new Set(variants.filter(Boolean))];
}

function extractPlaceDetailUrl(html) {
  const source = String(html || "")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
  const match = source.match(/https:\/\/map\.naver\.com\/p\/entry\/place\/(\d+)/i);

  if (!match?.[1]) {
    return "";
  }

  return `https://map.naver.com/p/entry/place/${match[1]}`;
}

export async function resolveNaverPlaceDetailUrl({ name = "", address = "" }) {
  for (const query of buildQueryVariants(name, address)) {
    const url = new URL(NAVER_WEB_SEARCH_URL);
    url.searchParams.set("where", "nexearch");
    url.searchParams.set("query", query);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    const detailUrl = extractPlaceDetailUrl(html);

    if (detailUrl) {
      return detailUrl;
    }
  }

  return "";
}
