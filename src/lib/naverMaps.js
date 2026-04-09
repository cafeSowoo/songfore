let sdkPromise = null;

function isMapReady() {
  return Boolean(window.naver?.maps?.Map);
}

function isGeocoderReady() {
  return Boolean(window.naver?.maps?.Service?.geocode);
}

function waitFor(check, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const tick = () => {
      if (check()) {
        resolve();
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        reject(new Error("NAVER Maps SDK did not finish loading in time."));
        return;
      }

      window.setTimeout(tick, 50);
    };

    tick();
  });
}

export function loadNaverMapsSdk(clientId) {
  if (isMapReady()) {
    return Promise.resolve(window.naver);
  }

  if (!clientId) {
    return Promise.reject(new Error("NAVER_MAPS_CLIENT_ID is missing."));
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const finalize = () => {
      waitFor(isMapReady)
        .then(() => resolve(window.naver))
        .catch(reject);
    };

    const existingScript = document.querySelector('script[data-naver-map-script="true"]');

    if (existingScript) {
      if (isMapReady()) {
        finalize();
        return;
      }

      existingScript.addEventListener("load", finalize, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load NAVER Maps SDK.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      clientId
    )}&submodules=geocoder`;
    script.async = true;
    script.dataset.naverMapScript = "true";
    script.onload = finalize;
    script.onerror = () => reject(new Error("Failed to load NAVER Maps SDK."));
    document.head.append(script);
  });

  return sdkPromise;
}

export async function searchAddressCandidates(query, clientId) {
  const trimmedQuery = String(query || "").trim();
  if (!trimmedQuery) {
    return [];
  }

  const naver = await loadNaverMapsSdk(clientId);

  if (!isGeocoderReady()) {
    await waitFor(isGeocoderReady, 3000);
  }

  const service = naver?.maps?.Service;

  if (!service?.geocode) {
    throw new Error("네이버 주소 검색 서비스를 불러오지 못했습니다.");
  }

  return new Promise((resolve, reject) => {
    service.geocode({ query: trimmedQuery }, (status, response) => {
      const okStatus = service.Status?.OK ?? "OK";

      if (status !== okStatus && status !== 200) {
        reject(new Error(`주소 검색에 실패했습니다. (${status})`));
        return;
      }

      const rawAddresses = response?.v2?.addresses || response?.addresses || [];
      const suggestions = rawAddresses
        .map((address, index) => ({
          id: `${address.x || "x"}:${address.y || "y"}:${index}`,
          address: address.roadAddress || address.jibunAddress || trimmedQuery,
          roadAddress: address.roadAddress || "",
          jibunAddress: address.jibunAddress || "",
          latitude: Number(address.y),
          longitude: Number(address.x)
        }))
        .filter(
          (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
        );

      resolve(suggestions);
    });
  });
}
