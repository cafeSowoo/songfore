const API_ROOT = "/api";

async function parseResponse(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchTripSnapshot(slug) {
  const response = await fetch(
    `${API_ROOT}/trip?slug=${encodeURIComponent(slug)}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  return parseResponse(response);
}

export async function createPlace(payload) {
  const response = await fetch(`${API_ROOT}/places`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export async function createComment(payload) {
  const response = await fetch(`${API_ROOT}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}
