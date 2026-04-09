let sdkPromise = null;

export function loadNaverMapsSdk(clientId) {
  if (window.naver?.maps?.Service) {
    return Promise.resolve(window.naver);
  }

  if (!clientId) {
    return Promise.reject(new Error("NAVER_MAPS_CLIENT_ID is missing."));
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-naver-map-script="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.naver), {
        once: true
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load NAVER Maps SDK")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.dataset.naverMapScript = "true";
    script.onload = () => resolve(window.naver);
    script.onerror = () => reject(new Error("Failed to load NAVER Maps SDK"));
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
  const service = naver?.maps?.Service;

  if (!service?.geocode) {
    throw new Error("Naver geocoder service is unavailable.");
  }

  return new Promise((resolve, reject) => {
    service.geocode({ query: trimmedQuery }, (status, response) => {
      const okStatus = service.Status?.OK ?? "OK";
      if (status !== okStatus && status !== 200) {
        reject(new Error(`Address search failed with status ${status}`));
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
