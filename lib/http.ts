export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: PRIVATE_HEADERS });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
