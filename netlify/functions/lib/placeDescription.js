function parseJsonSafely(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function serializePlaceDescription(reason = "", imageUrl = "", naverLink = "") {
  const normalizedReason = String(reason || "").trim();
  const normalizedImageUrl = String(imageUrl || "").trim();
  const normalizedNaverLink = String(naverLink || "").trim();

  if (!normalizedImageUrl && !normalizedNaverLink) {
    return normalizedReason;
  }

  return JSON.stringify({
    reason: normalizedReason,
    imageUrl: normalizedImageUrl,
    naverLink: normalizedNaverLink
  });
}

export function parsePlaceDescription(value = "") {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return {
      reason: "",
      imageUrl: "",
      naverLink: ""
    };
  }

  const parsed = parseJsonSafely(rawValue);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return {
      reason: rawValue,
      imageUrl: "",
      naverLink: ""
    };
  }

  return {
    reason: String(parsed.reason || "").trim(),
    imageUrl: String(parsed.imageUrl || "").trim(),
    naverLink: String(parsed.naverLink || "").trim()
  };
}
