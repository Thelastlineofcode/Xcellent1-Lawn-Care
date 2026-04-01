const FLY_BACKEND = "https://xcellent1-lawn-care-rpneaa.fly.dev";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route /api/* to Fly.io backend
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = (env.FLY_BACKEND_URL || FLY_BACKEND) + url.pathname + url.search;
      const backendReq = new Request(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
        redirect: "follow",
      });
      try {
        const resp = await fetch(backendReq);
        const newResp = new Response(resp.body, resp);
        newResp.headers.set("X-Powered-By", "Xcellent1-Worker");
        return newResp;
      } catch (e) {
        return new Response(JSON.stringify({ error: "Backend unavailable", detail: e.message }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: serve static assets
    try {
      return await env.ASSETS.fetch(request);
    } catch (_) {
      return new Response("Not found", { status: 404 });
    }
  },
};
