import { json } from "./lib/http.js";
import {
  buildTripSnapshot,
  ensureMember,
  getOrCreateTripBySlug
} from "./lib/tripService.js";
import { getSupabaseAdmin } from "./lib/supabaseAdmin.js";
import { parsePlaceDescription, serializePlaceDescription } from "./lib/placeDescription.js";

function validateCommentPayload(body) {
  const required = ["slug", "placeId", "nickname", "content"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

function validateDeleteCommentPayload(body) {
  const required = ["slug", "placeId", "commentId", "nickname"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

export default async (request) => {
  if (!["POST", "DELETE"].includes(request.method)) {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const body = await request.json();

    if (request.method === "DELETE") {
      validateDeleteCommentPayload(body);

      const supabase = getSupabaseAdmin();
      const trip = await getOrCreateTripBySlug(String(body.slug));
      const member = await ensureMember(trip.id, String(body.nickname));

      const { data: place, error: placeError } = await supabase
        .from("places")
        .select("id, description, created_by_member_id")
        .eq("id", String(body.placeId))
        .eq("trip_id", trip.id)
        .maybeSingle();

      if (placeError) {
        throw new Error(placeError.message || "Failed to validate place.");
      }

      if (!place) {
        return json({ error: "Place not found." }, { status: 404 });
      }

      if (String(body.commentId) === `${place.id}-primary`) {
        if (place.created_by_member_id !== member.id) {
          return json({ error: "작성한 닉네임이 일치해야 삭제할 수 있어요." }, { status: 403 });
        }

        const decodedDescription = parsePlaceDescription(place.description);
        const { error: updateError } = await supabase
          .from("places")
          .update({
            description: serializePlaceDescription(
              "",
              decodedDescription.imageUrl,
              decodedDescription.naverLink
            )
          })
          .eq("id", place.id);

        if (updateError) {
          throw new Error(updateError.message || "Failed to delete recommendation message.");
        }

        const snapshot = await buildTripSnapshot(trip.slug);
        return json(snapshot, { status: 200 });
      }

      const { data, error } = await supabase
        .from("place_comments")
        .delete()
        .eq("id", String(body.commentId))
        .eq("place_id", place.id)
        .eq("member_id", member.id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "Failed to delete comment.");
      }

      if (!data) {
        return json({ error: "작성한 닉네임이 일치해야 삭제할 수 있어요." }, { status: 403 });
      }

      const snapshot = await buildTripSnapshot(trip.slug);
      return json(snapshot, { status: 200 });
    }

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
