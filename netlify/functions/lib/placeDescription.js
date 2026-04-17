function parseJsonSafely(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function serializePlaceDescription(reason = "", imageUrl = "") {
  const normalizedReason = String(reason || "").trim();
  const normalizedImageUrl = String(imageUrl || "").trim();

  if (!normalizedImageUrl) {
    return normalizedReason;
  }

  return JSON.stringify({
    reason: normalizedReason,
    imageUrl: normalizedImageUrl
  });
}

export function parsePlaceDescription(value = "") {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return {
      reason: "",
      imageUrl: ""
    };
  }

  const parsed = parseJsonSafely(rawValue);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return {
      reason: rawValue,
      imageUrl: ""
    };
  }

  return {
    reason: String(parsed.reason || rawValue).trim(),
    imageUrl: String(parsed.imageUrl || "").trim()
  };
}
