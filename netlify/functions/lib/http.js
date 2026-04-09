export function json(body, init = {}) {
  const status = init.status || 200;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    ...(init.headers || {})
  };

  return new Response(JSON.stringify(body), {
    ...init,
    status,
    headers
  });
}
