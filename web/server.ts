import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import {
  fetchPendingOutbox,
  supabaseInsert,
} from "../bmad/agents/lib/supabase.ts";

const _encoder = new TextEncoder();

// MIME type mapping for static assets
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function getMimeType(filepath: string): string {
  const ext = filepath.toLowerCase().substring(filepath.lastIndexOf("."));
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function serveFile(path: string) {
  try {
    const data = await Deno.readFile(path);
    const mimeType = getMimeType(path);
    return new Response(data, {
      status: 200,
      headers: {
        "content-type": mimeType,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response("Not found", { status: 404 });
  }
}

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const PORT = Number(Deno.env.get("PORT") || "8000");
const HOST = Deno.env.get("HOST") || "0.0.0.0";

console.log(`Starting lightweight web server on http://${HOST}:${PORT}`);

serve(
  async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Serve static assets
    if (req.method === "GET" && pathname === "/") {
      return serveFile(
        new URL("./static/index.html", import.meta.url).pathname,
      );
    }
    if (req.method === "GET" && pathname === "/dashboard") {
      return serveFile(
        new URL("./static/dashboard.html", import.meta.url).pathname,
      );
    }
    if (req.method === "GET" && pathname.startsWith("/static/")) {
      const p = new URL(`.${pathname}`, import.meta.url).pathname;
      return serveFile(p);
    }

    // Serve uploaded images
    if (req.method === "GET" && pathname.startsWith("/uploads/")) {
      const filename = pathname.slice("/uploads/".length);
      const p = new URL(`./uploads/${filename}`, import.meta.url).pathname;
      try {
        const data = await Deno.readFile(p);
        const ct = filename.endsWith(".png")
          ? "image/png"
          : filename.endsWith(".jpg") || filename.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream";
        return new Response(data, {
          status: 200,
          headers: { "content-type": ct },
        });
      } catch (_e) {
        return new Response("Not found", { status: 404 });
      }
    }

    // API: create lead
    if (req.method === "POST" && pathname === "/api/leads") {
      const ct = req.headers.get("content-type") || "";
      let body: Record<string, unknown> = {};
      if (ct.includes("application/json")) {
        body = await req.json();
      } else {
        const form = await req.formData();
        for (const [k, v] of form.entries()) body[k] = v;
      }
      try {
        const row = {
          name: body.name || body.fullname || "unknown",
          phone: body.phone || body.mobile || null,
          email: body.email || null,
          notes: body.notes || null,
          source: body.source || "web",
          created_at: new Date().toISOString(),
        };
        const res = await supabaseInsert("leads", row);
        return jsonResponse({ ok: true, id: res.id });
      } catch (_err) {
        console.error("/api/leads error", _err);
        return jsonResponse({ ok: false, error: String(_err) }, 500);
      }
    }

    // API: create outbox event (used for crew updates)
    if (req.method === "POST" && pathname === "/api/outbox") {
      try {
        const body = await req.json();
        const ev = {
          type: body.type || "CREW_UPDATE",
          payload: body.payload || {},
          created_at: new Date().toISOString(),
        };
        const r = await supabaseInsert("events_outbox", ev);
        return jsonResponse({ ok: true, id: r.id });
      } catch (_err) {
        console.error("/api/outbox error", _err);
        return jsonResponse({ ok: false, error: String(_err) }, 500);
      }
    }

    // API: upload photo (base64 data url in JSON) and create an outbox event referencing it
    if (
      req.method === "POST" &&
      pathname.startsWith("/api/jobs/") &&
      pathname.endsWith("/photo")
    ) {
      try {
        const parts = pathname.split("/");
        const jobId = parts[2];
        const body = await req.json();
        const dataUrl = body.dataUrl;
        if (!dataUrl || !dataUrl.startsWith("data:")) {
          return jsonResponse({ ok: false, error: "missing dataUrl" }, 400);
        }
        const match = dataUrl.match(
          /^data:(image\/(png|jpeg|jpg));base64,(.*)$/,
        );
        if (!match) {
          return jsonResponse(
            { ok: false, error: "unsupported image format" },
            400,
          );
        }
        const ext = match[2] === "jpeg" ? "jpg" : match[2];
        const b64 = match[3];
        const bytes = atob(b64);
        const u8 = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i);

        // ensure uploads directory exists
        const uploadsDir = new URL("./uploads", import.meta.url).pathname;
        try {
          await Deno.mkdir(uploadsDir, { recursive: true });
        } catch (_e) {
          // ignore
        }
        const filename = `job_${jobId}_${Date.now()}.${ext}`;
        const outPath = uploadsDir + "/" + filename;
        await Deno.writeFile(outPath, u8);
        const publicPath = `/uploads/${filename}`;

        // register as outbox event so digest/owner gets notified
        const ev = {
          type: "JOB_PHOTO",
          payload: { jobId, photo_path: publicPath, filename },
          created_at: new Date().toISOString(),
        };
        const r = await supabaseInsert("events_outbox", ev);
        return jsonResponse({ ok: true, id: r.id, path: publicPath });
      } catch (_err) {
        console.error("/api/jobs/:id/photo error", _err);
        return jsonResponse({ ok: false, error: String(_err) }, 500);
      }
    }

    // API: simple listing used by dashboard — leads + pending outbox events
    if (req.method === "GET" && pathname === "/api/status") {
      try {
        // fetch pending outbox from lib (falls back to stub)
        const pending = await fetchPendingOutbox(new Date());
        // read leads from dev DB directly if needed
        let leads = [];
        try {
          const dbPath = new URL("../bmad/agents/dev_db.json", import.meta.url)
            .pathname;
          const txt = await Deno.readTextFile(dbPath);
          const db = JSON.parse(txt);
          leads = db.leads || [];
        } catch (_e) {
          // ignore
        }
        return jsonResponse({ ok: true, leads, pending });
      } catch (_err) {
        console.error("/api/status error", _err);
        return jsonResponse({ ok: false, error: String(_err) }, 500);
      }
    }

    return new Response("Not found", { status: 404 });
  },
  { port: PORT, hostname: HOST },
);
