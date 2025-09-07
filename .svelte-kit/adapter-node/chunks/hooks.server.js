import { json } from "@sveltejs/kit";
const rateLimitMap = /* @__PURE__ */ new Map();
const handle = async ({ event, resolve }) => {
  const { url, request } = event;
  if (url.pathname.startsWith("/api/")) {
    const ip = event.getClientAddress();
    const key = `${ip}:api`;
    const now = Date.now();
    const windowMs = 60 * 1e3;
    const maxRequests = 100;
    const current = rateLimitMap.get(key);
    if (current && now < current.resetTime) {
      if (current.count >= maxRequests) {
        return json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(current.resetTime / 1e3).toString()
            }
          }
        );
      }
      current.count++;
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    }
  }
  const response = await resolve(event);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Access-Control-Allow-Origin", "*");
  if (url.pathname.startsWith("/api/")) {
    const ip = event.getClientAddress();
    const key = `${ip}:api`;
    const current = rateLimitMap.get(key);
    if (current) {
      response.headers.set("X-RateLimit-Limit", "100");
      response.headers.set("X-RateLimit-Remaining", (100 - current.count).toString());
      response.headers.set("X-RateLimit-Reset", Math.ceil(current.resetTime / 1e3).toString());
    }
  }
  return response;
};
export {
  handle
};
