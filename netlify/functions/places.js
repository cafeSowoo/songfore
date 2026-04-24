import { json } from "./lib/http.js";
import { geocodeAddress } from "./lib/naverGeocode.js";
import { resolveNaverPlaceDetailUrl } from "./lib/naverPlaceDetailSearch.js";
import { serializePlaceDescription } from "./lib/placeDescription.js";
import {
  buildTripSnapshot,
  ensureMember,
  findMemberByNickname,
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

function normalizeNaverMapLink(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\/(naver\.me|map\.naver\.com)(\/|$)/i.test(raw)) {
    return raw;
  }

  if (/^\/\/(naver\.me|map\.naver\.com)(\/|$)/i.test(raw)) {
    return `https:${raw}`;
  }

  if (/^(naver\.me|map\.naver\.com)\//i.test(raw)) {
    return `https://${raw}`;
  }

  return "";
}

function validateDeletePayload(body) {
  const required = ["slug", "placeId", "nickname"];

  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

async function resolveStoredNaverLink(body) {
  const directLink = normalizeNaverMapLink(body.naverLink);

  if (directLink) {
    return directLink;
  }

  try {
    return await resolveNaverPlaceDetailUrl({
      name: String(body.name || "").trim(),
      address: String(body.resolvedAddress || body.address || "").trim()
    });
  } catch (error) {
    console.warn("Failed to resolve Naver place detail link while creating place.", error);
    return "";
  }
}

async function getTripBySlug(supabase, slug) {
  const { data, error } = await supabase.from("trips").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to read trip.");
  }

  if (!data) {
    throw new Error("Trip not found.");
  }

  return data;
}

async function insertPlace(supabase, payload) {
  const attempt = await supabase.from("places").insert(payload);

  if (!attempt.error) {
    return attempt;
  }

  if (String(attempt.error.message || "").includes("image_url")) {
    const { image_url, ...fallbackPayload } = payload;
    return supabase.from("places").insert(fallbackPayload);
  }

  return attempt;
}

export default async (request) => {
  if (!["POST", "DELETE"].includes(request.method)) {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    if (request.method === "DELETE") {
      const body = await request.json();
      validateDeletePayload(body);

      const supabase = getSupabaseAdmin();
      const trip = await getTripBySlug(supabase, String(body.slug).trim());
      const member = await findMemberByNickname(trip.id, String(body.nickname));

      if (!member) {
        return json({ error: "작성한 닉네임이 일치해야 삭제할 수 있어요." }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("places")
        .delete()
        .eq("trip_id", trip.id)
        .eq("id", String(body.placeId).trim())
        .eq("created_by_member_id", member.id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "Failed to delete place.");
      }

      if (!data) {
        return json({ error: "작성한 닉네임이 일치해야 삭제할 수 있어요." }, { status: 403 });
      }

      const snapshot = await buildTripSnapshot(trip.slug, { nickname: member.nickname });
      return json(snapshot, { status: 200 });
    }

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
    const storedNaverLink = await resolveStoredNaverLink(body);

    const { error } = await insertPlace(supabase, {
      trip_id: trip.id,
      category: String(body.category),
      name: String(body.name).trim(),
      address: location.roadAddress || location.jibunAddress || String(body.address).trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      image_url: String(body.imageUrl || "").trim() || null,
      description: serializePlaceDescription(body.description, body.imageUrl, storedNaverLink),
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
