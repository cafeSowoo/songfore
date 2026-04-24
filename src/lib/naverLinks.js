const NAVER_MAP_APP_NAME = "com.songfore.dajeonstargram";

export function normalizeNaverMapLink(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const isAllowedHost = (candidate) =>
    /^(https?:)?\/\/(naver\.me|map\.naver\.com)(\/|$)/i.test(candidate);

  if (/^https?:\/\//i.test(raw)) {
    return isAllowedHost(raw) ? raw : "";
  }

  if (raw.startsWith("//")) {
    return isAllowedHost(raw) ? `https:${raw}` : "";
  }

  if (/^(naver\.me|map\.naver\.com)\//i.test(raw)) {
    return `https://${raw}`;
  }

  if (raw.startsWith("/")) {
    return `https://map.naver.com${raw}`;
  }

  return "";
}

export function buildNaverMapUrl(place) {
  const directLink = normalizeNaverMapLink(place?.naverLink);

  if (directLink) {
    return directLink;
  }

  const query = String(place?.name || place?.address || "").trim();

  return query
    ? `https://map.naver.com/p/search/${encodeURIComponent(query)}`
    : "https://map.naver.com/p/";
}

export function buildNaverAppUrl(place) {
  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);
  const name = String(place?.name || "").trim();
  const query = String(place?.address || place?.name || "").trim();
  const appName = encodeURIComponent(NAVER_MAP_APP_NAME);

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && name) {
    return `nmap://place?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(
      longitude
    )}&name=${encodeURIComponent(name)}&appname=${appName}`;
  }

  if (query) {
    return `nmap://search?query=${encodeURIComponent(query)}&appname=${appName}`;
  }

  return `nmap://map?appname=${appName}`;
}

export function buildAndroidIntentUrl(appUrl) {
  return appUrl.replace(/^nmap:\/\//, "intent://") +
    "#Intent;scheme=nmap;package=com.nhn.android.nmap;end";
}

export function isAndroidDevice(userAgent = "") {
  return /android/i.test(userAgent);
}

export function isIosDevice(userAgent = "") {
  return /iphone|ipad|ipod/i.test(userAgent);
}
