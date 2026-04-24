import { json } from "./lib/http.js";
import {
  buildTripSnapshot,
  ensureMember,
  getOrCreateTripBySlug
} from "./lib/tripService.js";
import { getSupabaseAdmin } from "./lib/supabaseAdmin.js";

function validatePayload(body) {
  const required = ["slug", "placeId", "nickname"];

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
    validatePayload(body);

    const supabase = getSupabaseAdmin();
    const trip = await getOrCreateTripBySlug(String(body.slug).trim());
    const member = await ensureMember(trip.id, String(body.nickname));
    const placeId = String(body.placeId).trim();

    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("id")
      .eq("trip_id", trip.id)
      .eq("id", placeId)
      .maybeSingle();

    if (placeError) {
      throw new Error(placeError.message || "Failed to read place.");
    }

    if (!place) {
      throw new Error("장소를 찾지 못했어요.");
    }

    const { data: existingSave, error: readError } = await supabase
      .from("place_saves")
      .select("id")
      .eq("place_id", place.id)
      .eq("member_id", member.id)
      .maybeSingle();

    if (readError) {
      throw new Error(readError.message || "Failed to read save.");
    }

    if (existingSave) {
      const { error } = await supabase
        .from("place_saves")
        .delete()
        .eq("id", existingSave.id);

      if (error) {
        throw new Error(error.message || "Failed to remove save.");
      }
    } else {
      const { error } = await supabase.from("place_saves").insert({
        place_id: place.id,
        member_id: member.id
      });

      if (error) {
        throw new Error(error.message || "Failed to save place.");
      }
    }

    const snapshot = await buildTripSnapshot(trip.slug, { nickname: member.nickname });
    return json(snapshot, { status: 200 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "좋아요를 저장하지 못했어요."
      },
      { status: 500 }
    );
  }
};
