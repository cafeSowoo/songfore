const NAVER_GEOCODE_URL =
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

export async function geocodeAddress(query) {
  const apiKeyId = process.env.NAVER_MAPS_API_KEY_ID;
  const apiKey = process.env.NAVER_MAPS_API_KEY;

  if (!apiKeyId || !apiKey) {
    throw new Error("NAVER_MAPS_API_KEY_ID or NAVER_MAPS_API_KEY is missing.");
  }

  const url = new URL(NAVER_GEOCODE_URL);
  url.searchParams.set("query", query);

  const response = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": apiKeyId,
      "x-ncp-apigw-api-key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Naver geocoding failed with status ${response.status}`);
  }

  const payload = await response.json();
  const [firstAddress] = payload.addresses ?? [];

  if (!firstAddress) {
    throw new Error("No address result was returned from Naver geocoding.");
  }

  return {
    latitude: Number(firstAddress.y),
    longitude: Number(firstAddress.x),
    roadAddress: firstAddress.roadAddress || "",
    jibunAddress: firstAddress.jibunAddress || ""
  };
}
