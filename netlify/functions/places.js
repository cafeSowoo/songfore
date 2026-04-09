import { json } from "./lib/http.js";
import { geocodeAddress } from "./lib/naverGeocode.js";
import {
  buildTripSnapshot,
  ensureMember,
  getOrCreateTripBySlug
} from "./lib/tripService.js";
import { getSupabaseAdmin } from "./lib/supabaseAdmin.js";

function validatePlacePayload(body) {
  const required = ["slug", "category", "name", "address", "nickname"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

function hasCoordinates(body) {
  return (
    Number.isFinite(Number(body.latitude)) && Number.isFinite(Number(body.longitude))
  );
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const body = await request.json();
    validatePlacePayload(body);

    const supabase = getSupabaseAdmin();
    const trip = await getOrCreateTripBySlug(String(body.slug));
    const member = await ensureMember(trip.id, String(body.nickname));
    const location = hasCoordinates(body)
      ? {
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          roadAddress: String(body.resolvedAddress || body.address).trim(),
          jibunAddress: String(body.address).trim()
        }
      : await geocodeAddress(String(body.address));

    const { error } = await supabase.from("places").insert({
      trip_id: trip.id,
      category: String(body.category),
      name: String(body.name).trim(),
      address: location.roadAddress || location.jibunAddress || String(body.address).trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      description: String(body.description || "").trim(),
      created_by_member_id: member.id
    });

    if (error) {
      throw new Error(error.message || "Failed to create place.");
    }

    const snapshot = await buildTripSnapshot(trip.slug);
    return json(snapshot, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create place.";

    return json(
      {
        error:
          message.includes("status 401")
            ? "주소 찾기로 후보를 먼저 선택해 주세요. 현재 서버 지오코딩 인증이 올바르지 않습니다."
            : message
      },
      { status: 500 }
    );
  }
};
