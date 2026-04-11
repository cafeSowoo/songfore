export const categoryOptions = [
  { id: "all", label: "전체", tone: "#153328" },
  { id: "cafe", label: "카페", tone: "#b8613d" },
  { id: "restaurant", label: "식당", tone: "#ff6d33" },
  { id: "tour", label: "관광지", tone: "#0071d9" },
  { id: "pub", label: "술집", tone: "#7f5cff" },
  { id: "walk", label: "산책", tone: "#2d8f6f" },
  { id: "etc", label: "기타", tone: "#6f7a73" }
];

export const friendRoster = [
  { id: "jiwon", name: "지원", badge: "JI" },
  { id: "minho", name: "민호", badge: "MH" },
  { id: "yujin", name: "유진", badge: "YJ" },
  { id: "sohee", name: "소희", badge: "SH" },
  { id: "dohyun", name: "도현", badge: "DH" },
  { id: "haeun", name: "하은", badge: "HE" },
  { id: "jisu", name: "지수", badge: "JS" },
  { id: "taeho", name: "태호", badge: "TH" }
];

export const mapPositions = [
  { top: "16%", left: "18%" },
  { top: "25%", left: "68%" },
  { top: "44%", left: "42%" },
  { top: "58%", left: "20%" },
  { top: "64%", left: "72%" },
  { top: "78%", left: "48%" },
  { top: "34%", left: "82%" },
  { top: "72%", left: "12%" }
];

const seededAddressNameMap = [
  ["대전 중구 대종로480번길 15", "성심당 본점"],
  ["대전 동구 옛신탄진로 13", "오씨칼국수"],
  ["대전 서구 둔산대로 169", "한밭수목원"],
  ["대전 유성구 엑스포로 1", "대전신세계 Art & Science"],
  ["대전 동구 소제동 일대", "소제동 카페 거리"],
  ["대전 동구 자양동 산4-1", "대동하늘공원"]
];

export function getCategoryById(categoryId) {
  return (
    categoryOptions.find((category) => category.id === categoryId) ||
    categoryOptions[categoryOptions.length - 1]
  );
}

export function getVisiblePlaces(places, activeFilter) {
  if (activeFilter === "all") {
    return places;
  }

  return places.filter((place) => place.category === activeFilter);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAddress(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function extractLeadingPlaceName(address) {
  const normalized = normalizeAddress(address);

  if (!normalized) {
    return "";
  }

  const exactMatch = seededAddressNameMap.find(([seededAddress]) => {
    const compactSeed = normalizeAddress(seededAddress);
    return (
      normalized === compactSeed ||
      normalized.includes(compactSeed) ||
      compactSeed.includes(normalized)
    );
  });

  if (exactMatch) {
    return exactMatch[1];
  }

  const delimitedCandidate = normalized.split(/\s*[|,/]\s*|\s+-\s+/)[0]?.trim();

  if (delimitedCandidate && delimitedCandidate !== normalized) {
    return delimitedCandidate;
  }

  const addressStartMatch = normalized.match(
    /(서울|부산|대구|인천|광주|대전|울산|세종|제주|경기|강원|충북|충남|전북|전남|경북|경남)\b/
  );

  if (addressStartMatch && addressStartMatch.index > 0) {
    return normalized.slice(0, addressStartMatch.index).trim();
  }

  const firstChunk = normalized.split(/\s{2,}/)[0]?.trim();

  if (firstChunk && firstChunk !== normalized) {
    return firstChunk;
  }

  return "";
}

function derivePlaceName(formData, index) {
  const fromAddress = extractLeadingPlaceName(formData.address);

  if (fromAddress) {
    return fromAddress;
  }

  return `대전 스팟 ${index + 1}`;
}

export function createPlaceRecord(formData, index = 0) {
  const safeName = derivePlaceName(formData, index);
  const safeAddress = normalizeAddress(formData.address) || "대전 어딘가";
  const placeId = `place-${slugify(`${safeName}-${safeAddress}`) || Date.now()}`;
  const marker = mapPositions[index % mapPositions.length];

  return {
    id: placeId,
    name: safeName,
    category: formData.category || "etc",
    reason: formData.reason?.trim() || "우리 여행 동선에 자연스럽게 들어갈 것 같아요.",
    description:
      formData.description?.trim() ||
      `${safeName}은(는) 여행 일정 사이에 가볍게 들르기 좋고, 함께 저장해두기 좋은 분위기의 장소예요.`,
    address: safeAddress,
    imageUrl: "",
    friendName: formData.friendName?.trim() || "같이 저장한 친구",
    friendNote:
      formData.reason?.trim() || "이번 대전 여행에서 한 번쯤 같이 가보고 싶은 후보예요.",
    saveCount: 1,
    baseSaveCount: 0,
    saved: true,
    createdLabel: "방금 저장됨",
    mapPosition: marker,
    tags: ["새로 추가됨", "이번 여행 후보"]
  };
}
