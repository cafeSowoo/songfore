export function runNetlifyHandler(handler, context) {
  globalThis.process = globalThis.process || {};
  globalThis.process.env = context.env || {};

  const headers = new Headers(context.request.headers);
  headers.delete("origin");

  const cloudflareIp = context.request.headers.get("cf-connecting-ip");
  if (cloudflareIp && !headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", cloudflareIp);
  }

  return handler(new Request(context.request, { headers }));
}
