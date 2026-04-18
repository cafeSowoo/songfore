import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { parsePlaceDescription } from "./placeDescription.js";

function getDefaultTripTitle(slug) {
  return process.env.TRIP_TITLE || `${slug.toUpperCase()} 여행 보드`;
}

function getDefaultTripDescription() {
  return process.env.TRIP_DESCRIPTION || "함께 장소를 모으는 여행 보드";
}

function assertNoError(error, fallbackMessage) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getOrCreateTripBySlug(slug) {
  const supabase = getSupabaseAdmin();
  const { data: existingTrip, error: readError } = await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  assertNoError(readError, "Failed to read trip.");

  if (existingTrip) {
    return existingTrip;
  }

  const { data: createdTrip, error: createError } = await supabase
    .from("trips")
    .insert({
      slug,
      title: getDefaultTripTitle(slug),
      description: getDefaultTripDescription()
    })
    .select("*")
    .single();

  assertNoError(createError, "Failed to create trip.");
  return createdTrip;
}

export async function ensureMember(tripId, nickname) {
  const supabase = getSupabaseAdmin();
  const normalizedNickname = nickname.trim();

  const { data, error } = await supabase
    .from("members")
    .upsert(
      {
        trip_id: tripId,
        nickname: normalizedNickname,
        last_seen_at: new Date().toISOString()
      },
      {
        onConflict: "trip_id,nickname"
      }
    )
    .select("*")
    .single();

  assertNoError(error, "Failed to upsert member.");
  return data;
}

export async function buildTripSnapshot(slug) {
  const supabase = getSupabaseAdmin();
  const trip = await getOrCreateTripBySlug(slug);

  const [{ data: members, error: membersError }, { data: places, error: placesError }] =
    await Promise.all([
      supabase.from("members").select("*").eq("trip_id", trip.id),
      supabase
        .from("places")
        .select("*")
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: false })
    ]);

  assertNoError(membersError, "Failed to load members.");
  assertNoError(placesError, "Failed to load places.");

  const memberById = new Map((members || []).map((member) => [member.id, member]));
  const placeIds = (places || []).map((place) => place.id);

  let comments = [];
  if (placeIds.length > 0) {
    const { data, error } = await supabase
      .from("place_comments")
      .select("*")
      .in("place_id", placeIds)
      .order("created_at", { ascending: true });

    assertNoError(error, "Failed to load comments.");
    comments = data || [];
  }

  const commentsByPlaceId = new Map();
  for (const comment of comments) {
    const list = commentsByPlaceId.get(comment.place_id) || [];
    const commentAuthor = memberById.get(comment.member_id);

    list.push({
      id: comment.id,
      author: commentAuthor?.nickname || "익명 멤버",
      content: comment.content,
      createdAt: comment.created_at
    });

    commentsByPlaceId.set(comment.place_id, list);
  }

  const normalizedPlaces = (places || []).map((place) => {
    const author = memberById.get(place.created_by_member_id);
    const decodedDescription = parsePlaceDescription(place.description);

    return {
      id: place.id,
      category: place.category,
      name: place.name,
      address: place.address,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      imageUrl: place.image_url || decodedDescription.imageUrl || "",
      naverLink: decodedDescription.naverLink || "",
      description: decodedDescription.reason,
      author: author?.nickname || "익명 멤버",
      createdAt: place.created_at,
      comments: commentsByPlaceId.get(place.id) || []
    };
  });

  return {
    trip: {
      slug: trip.slug,
      title: trip.title,
      description: trip.description || getDefaultTripDescription()
    },
    places: normalizedPlaces
  };
}
