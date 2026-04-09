import { json } from "@netlify/functions";
import {
  buildTripSnapshot,
  ensureMember,
  getOrCreateTripBySlug
} from "./lib/tripService.js";
import { getSupabaseAdmin } from "./lib/supabaseAdmin.js";

function validateCommentPayload(body) {
  const required = ["slug", "placeId", "nickname", "content"];
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
    validateCommentPayload(body);

    const supabase = getSupabaseAdmin();
    const trip = await getOrCreateTripBySlug(String(body.slug));
    const member = await ensureMember(trip.id, String(body.nickname));

    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("id")
      .eq("id", String(body.placeId))
      .eq("trip_id", trip.id)
      .maybeSingle();

    if (placeError) {
      throw new Error(placeError.message || "Failed to validate place.");
    }

    if (!place) {
      return json({ error: "Place not found." }, { status: 404 });
    }

    const { error } = await supabase.from("place_comments").insert({
      place_id: place.id,
      member_id: member.id,
      content: String(body.content).trim()
    });

    if (error) {
      throw new Error(error.message || "Failed to create comment.");
    }

    const snapshot = await buildTripSnapshot(trip.slug);
    return json(snapshot, { status: 201 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to create comment."
      },
      { status: 500 }
    );
  }
};
