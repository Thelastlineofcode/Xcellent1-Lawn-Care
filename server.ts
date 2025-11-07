// Deno HTTP server with in-memory stores and API routes
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";

// In-memory storage
const leads: Map<string, any> = new Map();
const outbox: Map<string, any> = new Map();
let leadCounter = 1;
let eventCounter = 1;

// Helper: save base64 image to file
async function saveBase64Image(dataUrl: string, filename: string): Promise<void> {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid data URL");
  
  const base64Data = matches[2];
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  await Deno.mkdir("./web/uploads", { recursive: true });
  await Deno.writeFile(`./web/uploads/${filename}`, binaryData);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // CORS headers for local dev
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  
  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  
  // Serve static files
  if (url.pathname.startsWith("/static/")) {
    return serveDir(req, { fsRoot: "./web", urlRoot: "" });
  }
  
  // Serve uploads
  if (url.pathname.startsWith("/uploads/")) {
    return serveDir(req, { fsRoot: "./web", urlRoot: "" });
  }
  
  // Redirect root to index
  if (url.pathname === "/") {
    return new Response(null, {
      status: 302,
      headers: { "Location": "/static/index.html" }
    });
  }
  
  // POST /api/leads
  if (url.pathname === "/api/leads" && req.method === "POST") {
    try {
      const body = await req.json();
      
      // Server-side validation
      if (!body.name || body.name.trim().length < 2) {
        return new Response(
          JSON.stringify({ ok: false, error: "Name must be at least 2 characters" }),
          { status: 400, headers }
        );
      }
      if (!body.phone || !body.phone.trim()) {
        return new Response(
          JSON.stringify({ ok: false, error: "Phone is required" }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }
      
      const id = `lead-${leadCounter++}`;
      const lead = {
        id,
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        notes: body.notes ? body.notes.trim() : "",
        source: body.source || "web",
        created_at: new Date().toISOString()
      };
      
      leads.set(id, lead);
      
      // Also add to outbox as LEAD_CREATED event
      const eventId = `event-${eventCounter++}`;
      outbox.set(eventId, {
        id: eventId,
        type: "LEAD_CREATED",
        ref_id: id,
        payload: lead,
        created_at: new Date().toISOString()
      });
      
      console.log(`[server] Lead created: ${id}`);
      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
    } catch (err) {
      console.error("[server] Error creating lead:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }
  
  // GET /api/status
  if (url.pathname === "/api/status" && req.method === "GET") {
    try {
      const data = {
        ok: true,
        leads: Array.from(leads.values()),
        pending: Array.from(outbox.values())
      };
      return new Response(JSON.stringify(data), { status: 200, headers });
    } catch (err) {
      console.error("[server] Error getting status:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }
  
  // POST /api/jobs/:id/photo
  const photoMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/photo$/);
  if (photoMatch && req.method === "POST") {
    try {
      const jobId = photoMatch[1];
      const body = await req.json();
      
      if (!body.dataUrl || !body.dataUrl.startsWith("data:image/")) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid data URL" }),
          { status: 400, headers }
        );
      }
      
      const filename = `${jobId}-${Date.now()}.jpg`;
      await saveBase64Image(body.dataUrl, filename);
      const path = `/uploads/${filename}`;
      
      // Add photo upload event to outbox
      const eventId = `event-${eventCounter++}`;
      outbox.set(eventId, {
        id: eventId,
        type: "PHOTO_UPLOADED",
        ref_id: jobId,
        payload: { photo_path: path, job_id: jobId },
        created_at: new Date().toISOString()
      });
      
      console.log(`[server] Photo uploaded for job ${jobId}: ${path}`);
      return new Response(
        JSON.stringify({ ok: true, id: jobId, path }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error uploading photo:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Upload failed" }),
        { status: 500, headers }
      );
    }
  }
  
  // POST /api/outbox
  if (url.pathname === "/api/outbox" && req.method === "POST") {
    try {
      const body = await req.json();
      
      if (!body.type) {
        return new Response(
          JSON.stringify({ ok: false, error: "Event type is required" }),
          { status: 400, headers }
        );
      }
      
      const id = `event-${eventCounter++}`;
      const event = {
        id,
        type: body.type,
        ref_id: body.ref_id || "",
        payload: body.payload || {},
        created_at: new Date().toISOString()
      };
      
      outbox.set(id, event);
      console.log(`[server] Outbox event created: ${id} (${body.type})`);
      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
    } catch (err) {
      console.error("[server] Error creating outbox event:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }
  
  // 404 for unknown routes
  return new Response(
    JSON.stringify({ ok: false, error: "Not found" }),
    { status: 404, headers }
  );
}

const PORT = 8000;
console.log(`🚀 Server running on http://localhost:${PORT}`);
console.log(`📄 Lead Form: http://localhost:${PORT}/static/index.html`);
console.log(`📊 Dashboard: http://localhost:${PORT}/static/dashboard.html`);

serve(handler, { port: PORT });
