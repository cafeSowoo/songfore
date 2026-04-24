import { json } from "./lib/http.js";
import { buildTripSnapshot } from "./lib/tripService.js";

export default async (request) => {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") || process.env.TRIP_SLUG || "dj";
    const nickname = url.searchParams.get("nickname") || "";
    const snapshot = await buildTripSnapshot(slug, { nickname });
    return json(snapshot);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to load trip data."
      },
      { status: 500 }
    );
  }
};
