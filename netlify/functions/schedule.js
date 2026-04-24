import { json } from "./lib/http.js";
import {
  buildTripSnapshot,
  ensureMember,
  getOrCreateTripBySlug
} from "./lib/tripService.js";
import { getSupabaseAdmin } from "./lib/supabaseAdmin.js";

function validateCreatePayload(body) {
  const required = ["slug", "dayId", "time", "type"];

  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }

  if (body.type === "place" && !String(body.placeId || "").trim()) {
    throw new Error("placeId is required.");
  }

  if (body.type === "note" && !String(body.title || "").trim()) {
    throw new Error("title is required.");
  }
}

function validateDeletePayload(body) {
  const required = ["slug", "entryId"];

  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

async function resolveMemberId(tripId, nickname) {
  const normalizedNickname = String(nickname || "").trim();

  if (!normalizedNickname) {
    return null;
  }

  const member = await ensureMember(tripId, normalizedNickname);
  return member.id;
}

export default async (request) => {
  if (!["POST", "DELETE"].includes(request.method)) {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (request.method === "DELETE") {
      validateDeletePayload(body);

      const trip = await getOrCreateTripBySlug(String(body.slug).trim());
      const { data, error } = await supabase
        .from("schedule_entries")
        .delete()
        .eq("trip_id", trip.id)
        .eq("id", String(body.entryId).trim())
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "Failed to delete schedule entry.");
      }

      if (!data) {
        throw new Error("삭제할 일정을 찾지 못했어요.");
      }

      const snapshot = await buildTripSnapshot(trip.slug, {
        nickname: String(body.nickname || "").trim()
      });
      return json(snapshot, { status: 200 });
    }

    validateCreatePayload(body);

    const trip = await getOrCreateTripBySlug(String(body.slug).trim());
    const memberId = await resolveMemberId(trip.id, body.nickname);
    const entryType = String(body.type).trim();
    const placeId = entryType === "place" ? String(body.placeId).trim() : null;

    if (placeId) {
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
        throw new Error("일정에 넣을 장소를 찾지 못했어요.");
      }
    }

    const { error } = await supabase.from("schedule_entries").insert({
      trip_id: trip.id,
      day_id: String(body.dayId).trim(),
      time: String(body.time).trim(),
      entry_type: entryType,
      place_id: placeId,
      title: entryType === "note" ? String(body.title).trim() : null,
      created_by_member_id: memberId
    });

    if (error) {
      throw new Error(error.message || "Failed to create schedule entry.");
    }

    const snapshot = await buildTripSnapshot(trip.slug, {
      nickname: String(body.nickname || "").trim()
    });
    return json(snapshot, { status: 201 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "일정을 저장하지 못했어요."
      },
      { status: 500 }
    );
  }
};
