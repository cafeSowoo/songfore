import { json } from "@netlify/functions";
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
    const location = await geocodeAddress(String(body.address));

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
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to create place."
      },
      { status: 500 }
    );
  }
};
