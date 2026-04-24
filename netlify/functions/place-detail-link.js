import { json } from "./lib/http.js";
import { resolveNaverPlaceDetailUrl } from "./lib/naverPlaceDetailSearch.js";

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
      return json({ naverLink: "" });
    }

    const naverLink = await resolveNaverPlaceDetailUrl({ name, address });
    return json({ naverLink });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve place detail link.";

    return json({ error: message }, { status: 500 });
  }
};
