const CATEGORY_DEFINITIONS = [
  { id: "all", label: "전체", tone: "#dbe4df" },
  { id: "cafe", label: "카페", tone: "#dff3eb" },
  { id: "restaurant", label: "식당", tone: "#fde7dd" },
  { id: "tour", label: "관광지", tone: "#deedff" },
  { id: "shopping", label: "쇼핑", tone: "#ece7ff" },
  { id: "etc", label: "기타", tone: "#eef1ec" }
];

const CATEGORY_LOOKUP = new Map(
  CATEGORY_DEFINITIONS.map((category) => [category.id, category])
);

const FALLBACK_CATEGORY = CATEGORY_LOOKUP.get("etc");

const CATEGORY_IMAGE_POOLS = {
  cafe: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80"
  ],
  tour: [
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80"
  ],
  shopping: [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80"
  ],
  etc: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
  ]
};

const PLACE_NAME_HINTS = [
  { pattern: /성심당|대전역|은행동|대종로480/i, name: "성심당 본점" },
  { pattern: /오씨칼국수|옛신탄진로/i, name: "오씨칼국수" },
  { pattern: /한밭수목원|둔산대로/i, name: "한밭수목원" },
  { pattern: /신세계|art\s*&\s*science|엑스포로/i, name: "대전신세계 Art & Science" },
  { pattern: /소제동/i, name: "소제동 카페 거리" },
  { pattern: /대동하늘공원|자양동/i, name: "대동하늘공원" },
  { pattern: /대흥동|와인바/i, name: "대흥동 와인바 골목" },
  { pattern: /테미오래|보문로/i, name: "테미오래" }
];

const FRIEND_NOTE_TEMPLATES = {
  cafe: "사진도 남기고 잠깐 쉬어가기 좋은 분위기예요.",
  restaurant: "첫 끼나 저녁 식사 코스로 넣기 좋아 보여요.",
  tour: "대전 여행 느낌을 확실하게 살려주는 대표 코스예요.",
  shopping: "둘러보다가 자연스럽게 다음 코스로 이어가기 좋은 곳이에요.",
  etc: "동선 중간에 넣으면 여행 흐름이 한결 부드러워져요."
};

export const categoryOptions = CATEGORY_DEFINITIONS.map((category) => ({ ...category }));

export const friendRoster = [
  "지원",
  "민호",
  "유진",
  "하은",
  "태오",
  "현우",
  "서윤",
  "지호"
];

export const mapPositions = [
  { top: "14%", left: "15%" },
  { top: "26%", left: "64%" },
  { top: "46%", left: "38%" },
  { top: "60%", left: "18%" },
  { top: "58%", left: "70%" },
  { top: "76%", left: "42%" },
  { top: "34%", left: "78%" },
  { top: "66%", left: "14%" }
];

function hashString(value) {
  let hash = 0;

  for (const character of String(value || "")) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatRelativeTime(dateLike) {
  const timestamp = new Date(dateLike).getTime();

  if (!Number.isFinite(timestamp)) {
    return "방금 전";
  }

  const deltaMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < minute) {
    return "방금 전";
  }

  if (deltaMs < hour) {
    return `${Math.max(1, Math.floor(deltaMs / minute))}분 전`;
  }

  if (deltaMs < day) {
    return `${Math.max(1, Math.floor(deltaMs / hour))}시간 전`;
  }

  if (deltaMs < day * 2) {
    return "어제";
  }

  return `${Math.max(2, Math.floor(deltaMs / day))}일 전`;
}

function pickMapPosition(key, index) {
  const seed = hashString(key || index);
  const base = mapPositions[index % mapPositions.length];
  const top = 14 + (seed % 58);
  const left = 12 + ((seed >> 4) % 72);

  return {
    top: `${Math.round(base ? (Number.parseFloat(base.top) + top) / 2 : top)}%`,
    left: `${Math.round(base ? (Number.parseFloat(base.left) + left) / 2 : left)}%`
  };
}

function normalizeRemoteMapPositions(places) {
  if (places.length === 0) {
    return [];
  }

  const coordinatePlaces = places.filter(
    (place) =>
      Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))
  );

  if (coordinatePlaces.length === 0) {
    return places.map((place, index) => ({
      ...place,
      mapPosition: pickMapPosition(place.id, index)
    }));
  }

  const latitudes = coordinatePlaces.map((place) => Number(place.latitude));
  const longitudes = coordinatePlaces.map((place) => Number(place.longitude));
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return places.map((place, index) => {
    if (
      !Number.isFinite(Number(place.latitude)) ||
      !Number.isFinite(Number(place.longitude))
    ) {
      return {
        ...place,
        mapPosition: pickMapPosition(place.id, index)
      };
    }

    const normalizedLeft =
      maxLng === minLng
        ? 50
        : 12 + ((Number(place.longitude) - minLng) / (maxLng - minLng)) * 72;
    const normalizedTop =
      maxLat === minLat
        ? 50
        : 78 - ((Number(place.latitude) - minLat) / (maxLat - minLat)) * 60;

    return {
      ...place,
      mapPosition: {
        top: `${normalizedTop.toFixed(2)}%`,
        left: `${normalizedLeft.toFixed(2)}%`
      }
    };
  });
}

function chooseImageForPlace(categoryId, name) {
  const pool = CATEGORY_IMAGE_POOLS[categoryId] || CATEGORY_IMAGE_POOLS.etc;
  const index = hashString(name || categoryId) % pool.length;
  return pool[index];
}

function inferPlaceNameFromAddress(address, fallbackCategory = "etc") {
  const normalizedAddress = String(address || "").trim();

  if (!normalizedAddress) {
    return getCategoryById(fallbackCategory).label;
  }

  for (const hint of PLACE_NAME_HINTS) {
    if (hint.pattern.test(normalizedAddress)) {
      return hint.name;
    }
  }

  const tokens = normalizedAddress
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !/(특별시|광역시|특별자치시|특별자치도|도|시|군|구|동|읍|면|리)$/.test(token));

  return tokens.slice(0, 2).join(" ") || normalizedAddress;
}

function buildGeneratedReason(categoryId, address) {
  const category = getCategoryById(categoryId);
  const location = String(address || "").trim();

  if (!location) {
    return `${category.label} 코스로 넣기 좋은 장소예요.`;
  }

  return `${location} 근처에서 바로 들르기 좋은 ${category.label} 코스예요.`;
}

function buildSaveCount(name, commentCount) {
  return 3 + (hashString(name) % 4) + Number(commentCount || 0);
}

function toUiComment(comment, index) {
  return {
    id: comment.id || `comment-${index}`,
    name: comment.author || "",
    text: comment.content || "",
    time: formatRelativeTime(comment.createdAt),
    accent: index % 2 === 0 ? "left" : "right"
  };
}

function toUiPlace(remotePlace, index) {
  const friendName = remotePlace.author || friendRoster[index % friendRoster.length];
  const comments = Array.isArray(remotePlace.comments) ? remotePlace.comments : [];
  const description = String(remotePlace.description || "").trim();
  const friendNote =
    description || FRIEND_NOTE_TEMPLATES[remotePlace.category] || FRIEND_NOTE_TEMPLATES.etc;
  const reason = buildGeneratedReason(remotePlace.category, remotePlace.address);
  const saveCount = buildSaveCount(remotePlace.name, comments.length);

  return {
    id: remotePlace.id,
    name: remotePlace.name,
    category: remotePlace.category || "etc",
    reason,
    description,
    address: remotePlace.address || "",
    latitude: Number(remotePlace.latitude),
    longitude: Number(remotePlace.longitude),
    imageUrl: chooseImageForPlace(remotePlace.category, remotePlace.name),
    friendName,
    friendNote,
    saveCount,
    baseSaveCount: saveCount,
    saved: false,
    createdLabel: `${friendName}이 ${formatRelativeTime(remotePlace.createdAt)} 추천`,
    comments: comments.map(toUiComment),
    tags: [],
    mapPosition: null
  };
}

function toUiSnapshot(snapshot) {
  const mappedPlaces = normalizeRemoteMapPositions(
    (snapshot?.places || []).map((place, index) => toUiPlace(place, index))
  );

  return {
    trip: {
      slug: snapshot?.trip?.slug || "dj",
      title: snapshot?.trip?.title || "대전여행",
      description:
        snapshot?.trip?.description || "8명이 함께 고르는 대전 스팟"
    },
    places: mappedPlaces
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  const parsed = parseJsonSafely(text);

  if (!response.ok) {
    const message =
      parsed?.error ||
      parsed?.message ||
      `요청에 실패했습니다. (${response.status})`;
    throw new Error(message);
  }

  if (!parsed) {
    throw new Error("서버 응답을 읽지 못했습니다.");
  }

  return parsed;
}

function getFallbackMeta(baseMeta = {}) {
  return {
    tripSlug: baseMeta.slug || "dj",
    tripTitle: baseMeta.title || "대전여행",
    tripDescription: baseMeta.description || "8명이 함께 고르는 대전 스팟",
    naverMapsClientId: ""
  };
}

export function getRuntimeConfig(baseMeta = {}) {
  const fallback = getFallbackMeta(baseMeta);
  const injected =
    typeof window !== "undefined" && window.__DJ_CONFIG__ ? window.__DJ_CONFIG__ : {};

  return {
    tripSlug: injected.tripSlug || fallback.tripSlug,
    tripTitle: injected.tripTitle || fallback.tripTitle,
    tripDescription: injected.tripDescription || fallback.tripDescription,
    naverMapsClientId: injected.naverMapsClientId || fallback.naverMapsClientId
  };
}

export function getCategoryById(categoryId) {
  return CATEGORY_LOOKUP.get(categoryId) || FALLBACK_CATEGORY;
}

export function getVisiblePlaces(places, filterId) {
  if (filterId === "all") {
    return places;
  }

  return places.filter((place) => place.category === filterId);
}

export function createPlaceRecord(formData, index = 0, authorName = "") {
  const categoryId = formData.category || "etc";
  const normalizedAddress = String(formData.address || "").trim();
  const friendName =
    authorName || friendRoster[index % friendRoster.length] || "나";
  const name =
    String(formData.name || "").trim() ||
    inferPlaceNameFromAddress(normalizedAddress, categoryId);
  const saveCount = 3 + (index % 5);

  return {
    id: `place-${Date.now()}-${slugify(name) || index}`,
    name,
    category: categoryId,
    reason: buildGeneratedReason(categoryId, normalizedAddress),
    description: String(formData.description || "").trim(),
    address: normalizedAddress,
    imageUrl: chooseImageForPlace(categoryId, name),
    friendName,
    friendNote:
      String(formData.reason || "").trim() ||
      FRIEND_NOTE_TEMPLATES[categoryId] ||
      FRIEND_NOTE_TEMPLATES.etc,
    saveCount,
    baseSaveCount: saveCount,
    saved: false,
    createdLabel: `${friendName}이 방금 추천`,
    comments: [],
    tags: [],
    mapPosition: pickMapPosition(name, index)
  };
}

export async function fetchTripSnapshot(slug = "dj") {
  const response = await fetch(
    `/.netlify/functions/trip?slug=${encodeURIComponent(slug)}`,
    {
      headers: { Accept: "application/json" }
    }
  );

  const payload = await readJsonResponse(response);
  return toUiSnapshot(payload);
}

export async function searchPlaceCandidates(query) {
  const response = await fetch(
    `/.netlify/functions/place-search?q=${encodeURIComponent(String(query || "").trim())}`,
    {
      headers: { Accept: "application/json" }
    }
  );

  return readJsonResponse(response);
}

export async function createPlace(payload) {
  const address = String(payload.address || "").trim();
  const category = payload.category || "etc";
  const response = await fetch("/.netlify/functions/places", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      slug: payload.slug || "dj",
      category,
      name:
        String(payload.name || "").trim() ||
        inferPlaceNameFromAddress(address, category),
      address,
      description: String(payload.description || payload.reason || "").trim(),
      nickname: String(payload.nickname || "").trim(),
      latitude: payload.latitude,
      longitude: payload.longitude,
      resolvedAddress: payload.resolvedAddress
    })
  });

  const snapshot = await readJsonResponse(response);
  return toUiSnapshot(snapshot);
}

export async function createComment(payload) {
  const response = await fetch("/.netlify/functions/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      slug: payload.slug || "dj",
      placeId: payload.placeId,
      nickname: String(payload.nickname || "").trim(),
      content: String(payload.content || "").trim()
    })
  });

  const snapshot = await readJsonResponse(response);
  return toUiSnapshot(snapshot);
}
