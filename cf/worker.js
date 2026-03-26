export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originBase = (env.ORIGIN_URL || "").trim();
    if (!originBase) {
      return new Response(
        "Missing ORIGIN_URL worker variable. Set it to your Fly app URL.",
        { status: 500 },
      );
    }

    // Serve static files from web/static if available
    // Otherwise proxy to origin
    const originUrl = originBase + url.pathname + url.search;

    const originRequest = new Request(originUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(originRequest);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-Powered-By", "Xcellent1-Worker");
      return newResponse;
    } catch (e) {
      return new Response("Service temporarily unavailable", { status: 503 });
    }
  },
};
