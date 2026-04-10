import { json } from "./lib/http.js";
import { geocodeAddress } from "./lib/naverGeocode.js";
import { searchLocalPlaces } from "./lib/naverLocalSearch.js";

const SEARCH_CENTER = {
  name: "중앙로역",
  address: "대전광역시 중구 중앙로 지하145"
};

const geocodeCache = new Map();
let centerLocationPromise = null;

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeForCompare(value) {
  return normalizeWhitespace(value).replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

function buildQueryVariants(query) {
  const trimmedQuery = normalizeWhitespace(query);
  const variants = [trimmedQuery];

  if (!/대전/.test(trimmedQuery)) {
    variants.push(`${trimmedQuery} 대전`);
  }

  if (!/중앙로역/.test(trimmedQuery)) {
    variants.push(`${trimmedQuery} 중앙로역`);
  }

  if (!/대전/.test(trimmedQuery) && !/중앙로역/.test(trimmedQuery)) {
    variants.push(`${trimmedQuery} 대전 중앙로역`);
  }

  return [...new Set(variants)];
}

function candidateKey(candidate) {
  return [
    normalizeForCompare(candidate.name),
    normalizeForCompare(candidate.roadAddress || candidate.address)
  ].join(":");
}

async function geocodeCached(query) {
  const trimmedQuery = normalizeWhitespace(query);

  if (!trimmedQuery) {
    return null;
  }

  if (!geocodeCache.has(trimmedQuery)) {
    geocodeCache.set(
      trimmedQuery,
      geocodeAddress(trimmedQuery).catch(() => null)
    );
  }

  return geocodeCache.get(trimmedQuery);
}

function getCenterLocation() {
  if (!centerLocationPromise) {
    centerLocationPromise = geocodeCached(SEARCH_CENTER.address);
  }

  return centerLocationPromise;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(origin, target) {
  if (!origin || !target) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadius = 6371000;
  const deltaLat = toRadians(target.latitude - origin.latitude);
  const deltaLng = toRadians(target.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(target.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(candidate, query) {
  const normalizedQuery = normalizeForCompare(query);
  const normalizedName = normalizeForCompare(candidate.name);
  const normalizedAddress = normalizeForCompare(
    candidate.roadAddress || candidate.address
  );
  let score = 0;

  if (normalizedName === normalizedQuery) {
    score += 120;
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score += 80;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 40;
  }

  if (/대전/.test(candidate.roadAddress || candidate.address)) {
    score += 25;
  }

  if (/중앙로|중구/.test(candidate.roadAddress || candidate.address)) {
    score += 12;
  }

  if (normalizedAddress.includes("대전")) {
    score += 10;
  }

  if (Number.isFinite(candidate.distanceMeters)) {
    score -= Math.min(candidate.distanceMeters, 50000) / 1000;
  }

  return score;
}

async function enrichCandidate(candidate, centerLocation) {
  const location =
    (await geocodeCached(candidate.roadAddress || candidate.address)) ||
    (await geocodeCached(candidate.address));

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  return {
    ...candidate,
    id: candidateKey(candidate),
    latitude,
    longitude,
    roadAddress: location?.roadAddress || candidate.roadAddress || "",
    jibunAddress: location?.jibunAddress || candidate.address || "",
    address:
      location?.roadAddress ||
      candidate.roadAddress ||
      location?.jibunAddress ||
      candidate.address,
    distanceMeters: Number.isFinite(latitude) && Number.isFinite(longitude)
      ? getDistanceMeters(centerLocation, { latitude, longitude })
      : Number.POSITIVE_INFINITY
  };
}

async function fallbackToGeocode(query, centerLocation) {
  const location = await geocodeCached(query);

  if (!location) {
    return [];
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  return [
    {
      id: `fallback:${normalizeForCompare(query)}`,
      name: normalizeWhitespace(query),
      address: location.roadAddress || location.jibunAddress || normalizeWhitespace(query),
      roadAddress: location.roadAddress || "",
      jibunAddress: location.jibunAddress || "",
      category: "주소 검색 결과",
      telephone: "",
      link: "",
      latitude,
      longitude,
      distanceMeters: getDistanceMeters(centerLocation, { latitude, longitude })
    }
  ];
}

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const query = normalizeWhitespace(url.searchParams.get("q"));

    if (!query) {
      return json({ suggestions: [] });
    }

    const centerLocation = await getCenterLocation();
    const rawCandidates = [];

    for (const variant of buildQueryVariants(query)) {
      const results = await searchLocalPlaces(variant, { display: 5 });
      rawCandidates.push(...results);
    }

    const uniqueCandidates = [...new Map(rawCandidates.map((item) => [candidateKey(item), item])).values()];
    let suggestions = await Promise.all(
      uniqueCandidates.slice(0, 8).map((candidate) =>
        enrichCandidate(candidate, centerLocation)
      )
    );

    suggestions = suggestions
      .filter(
        (candidate) =>
          Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude)
      )
      .sort((left, right) => scoreCandidate(right, query) - scoreCandidate(left, query))
      .slice(0, 6);

    if (suggestions.length === 0) {
      suggestions = await fallbackToGeocode(query, centerLocation);
    }

    return json({
      searchCenter: SEARCH_CENTER,
      suggestions
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search places.";

    return json(
      {
        error:
          message.includes("NAVER_SEARCH_CLIENT_ID")
            ? "네이버 장소 검색 키가 없어 후보 검색을 사용할 수 없습니다."
            : message
      },
      { status: 500 }
    );
  }
};
