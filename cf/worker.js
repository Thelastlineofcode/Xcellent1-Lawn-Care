// Xcellent1 Lawn Care - Cloudflare Worker
// Static assets via ASSETS binding. Pure static site — no backend.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Force HTTPS — redirect HTTP to HTTPS
    const forwardedProto = request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
    if (forwardedProto === "http") {
      return Response.redirect(
        `https://${url.hostname}${url.pathname}${url.search}`,
        301
      );
    }

    // Handle root path redirect to home page
    if (url.pathname === "/") {
      return Response.redirect("/home.html", 302);
    }

    // Serve static assets for everything else
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response("Not found", { status: 404 });
    }
  },
};
