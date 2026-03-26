// Xcellent1 Lawn Care - Cloudflare Worker
// Serves static assets from web/static via the ASSETS binding

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve static assets
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  },
};
