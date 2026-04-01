// Xcellent1 Lawn Care - Cloudflare Worker
// Static assets via ASSETS binding
// /api/* routes proxied to Fly.io backend

const FLY_BACKEND = "https://xcellent1-lawn-care-rpneaa.fly.dev";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy /api/* to Fly.io backend
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(url.pathname + url.search, FLY_BACKEND);
      const proxyRequest = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
        redirect: "follow",
      });
      try {
        return await fetch(proxyRequest);
      } catch (e) {
        return new Response(JSON.stringify({ error: "Backend unavailable" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Serve static assets for everything else
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response("Not found", { status: 404 });
    }
  },
};
