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
    const headers: Record<string, string> = {
      "content-type": mimeType,
    };

    // For HTML files, set cache-control headers to prevent stale login/config data
    if (mimeType.includes("text/html")) {
      headers["cache-control"] = "no-cache, no-store, must-revalidate";
      headers["pragma"] = "no-cache";
      headers["expires"] = "0";
    } else {
      headers["cache-control"] = "public, max-age=3600";
    }

    return new Response(data, { status: 200, headers });
  } catch (err) {
    return new Response("Not found", { status: 404 });
  }
}

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS, PATCH, DELETE",
      "access-control-allow-headers": "Authorization, Content-Type",
    },
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
      // Redirect root to canonical home path
      return new Response(null, {
        status: 302,
        headers: { Location: "/static/home.html" },
      });
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

    // API: owner invite validation (basic stub) - return 404 for unknown tokens
    if (req.method === "GET" && pathname.startsWith("/api/owner/invite/")) {
      try {
        const token = pathname.replace("/api/owner/invite/", "");
        if (!token || token.length < 5) {
          return jsonResponse({ ok: false, error: "Not found" }, 404);
        }
        // For now, we don't manage invitations here; return 404 for unknown token
        return jsonResponse({ ok: false, error: "Not found" }, 404);
      } catch (err) {
        console.error("/api/owner/invite error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

      // API: owner invoices - list/create
      if (pathname === "/api/owner/invoices") {
        try {
          const { authenticateRequest } = await import("../supabase_auth.ts");
          const authRes = await authenticateRequest(req);
          if (!authRes || authRes.profile.role !== "owner") {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }
          if (req.method === "GET") {
            const { supabaseSelect } = await import("../bmad/agents/lib/supabase.ts");
            const invoices = await supabaseSelect("invoices", "select=*");
            return jsonResponse({ ok: true, invoices });
          }
          if (req.method === "POST") {
            const body = await req.json();
            const { supabaseInsert } = await import("../bmad/agents/lib/supabase.ts");
            const created = await supabaseInsert("invoices", body);
            return jsonResponse({ ok: true, invoice: created });
          }
          return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
        } catch (err) {
          console.error("/api/owner/invoices error", err);
          return jsonResponse({ ok: false, error: String(err) }, 500);
        }
      }

    // API: owner metrics endpoint - requires Authorization Bearer token
    if (req.method === "GET" && pathname === "/api/owner/metrics") {
      try {
        // lazy import auth helper
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const auth = await authenticateRequest(req);
        if (!auth) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

        // Build small metrics object; in real app we'd query RLS-protected resources
        const metrics = {
          ok: true,
          owner: auth.profile.email,
          revenue_this_month: 0,
          jobs_this_week: 0,
          active_crew: 0,
          accounts_receivable: 0,
          new_applications: 0,
        };
        return jsonResponse(metrics);
      } catch (err) {
        console.error("/api/owner/metrics error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // API: owner jobs - list/create/update
    if (pathname === "/api/owner/jobs") {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

        if (req.method === "GET") {
          const { supabaseSelect } = await import("../bmad/agents/lib/supabase.ts");
          const jobs = await supabaseSelect("jobs", "select=*");
          return jsonResponse({ ok: true, jobs });
        }
        if (req.method === "POST") {
          const body = await req.json();
          const { supabaseInsert } = await import("../bmad/agents/lib/supabase.ts");
          const created = await supabaseInsert("jobs", body);
          return jsonResponse({ ok: true, job: created });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/jobs error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    if (pathname.startsWith("/api/owner/jobs/")) {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        const parts = pathname.split("/");
        const jobId = parts[parts.length - 1];
        if (req.method === "PATCH") {
          const body = await req.json();
          const { supabaseUpdate } = await import("../bmad/agents/lib/supabase.ts");
          const updated = await supabaseUpdate("jobs", "id", jobId, body);
          return jsonResponse({ ok: true, job: updated });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/jobs/:id error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // API: owner applications - list/update
    if (pathname === "/api/owner/applications") {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        if (req.method === "GET") {
          const { supabaseSelect } = await import("../bmad/agents/lib/supabase.ts");
          const apps = await supabaseSelect("applications", "select=*");
          return jsonResponse({ ok: true, applications: apps });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/applications error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    if (pathname.startsWith("/api/owner/applications/")) {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        const parts = pathname.split("/");
        const appId = parts[parts.length - 1];
        if (req.method === "PATCH") {
          const body = await req.json();
          const { supabaseUpdate } = await import("../bmad/agents/lib/supabase.ts");
          const updated = await supabaseUpdate("applications", "id", appId, body);
          return jsonResponse({ ok: true, application: updated });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/applications/:id error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // API: owner waitlist - list/create/update/convert
    if (pathname === "/api/owner/waitlist") {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        if (req.method === "GET") {
          const { supabaseSelect } = await import("../bmad/agents/lib/supabase.ts");
          const w = await supabaseSelect("waitlist", "select=*");
          return jsonResponse({ ok: true, waitlist: w });
        }
        if (req.method === "POST") {
          const body = await req.json();
          const { supabaseInsert } = await import("../bmad/agents/lib/supabase.ts");
          const created = await supabaseInsert("waitlist", body);
          return jsonResponse({ ok: true, waitlist_item: created });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/waitlist error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    if (pathname.startsWith("/api/owner/waitlist/")) {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        const parts = pathname.split("/");
        const itemId = parts[parts.length - 1];
        if (req.method === "PATCH") {
          const body = await req.json();
          const { supabaseUpdate } = await import("../bmad/agents/lib/supabase.ts");
          const updated = await supabaseUpdate("waitlist", "id", itemId, body);
          return jsonResponse({ ok: true, waitlist_item: updated });
        }
        if (req.method === "POST" && pathname.endsWith("/convert")) {
          // convert waitlist item to client (just a stub on server)
          // We'll return 200 and a message for now
          return jsonResponse({ ok: true, message: "converted" });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/waitlist/:id error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // API: owner clients (/api/owner/clients) - list/create
    if (pathname === "/api/owner/clients") {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") {
          return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        }

        if (req.method === "GET") {
          const { supabaseSelect } = await import("../bmad/agents/lib/supabase.ts");
          const clients = await supabaseSelect("clients", "select=*");
          return jsonResponse({ ok: true, clients });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { supabaseInsert } = await import("../bmad/agents/lib/supabase.ts");
          const resInsert = await supabaseInsert("clients", body);
          return jsonResponse({ ok: true, client: resInsert });
        }

        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/clients error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // API: owner client by id
    if (pathname.startsWith("/api/owner/clients/")) {
      try {
        const { authenticateRequest } = await import("../supabase_auth.ts");
        const authRes = await authenticateRequest(req);
        if (!authRes || authRes.profile.role !== "owner") {
          return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
        }
        const parts = pathname.split("/");
        const clientId = parts[parts.length - 1];
        if (req.method === "PATCH") {
          const body = await req.json();
          const { supabaseUpdate } = await import("../bmad/agents/lib/supabase.ts");
          const updated = await supabaseUpdate("clients", "id", clientId, body);
          return jsonResponse({ ok: true, client: updated });
        }
        return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
      } catch (err) {
        console.error("/api/owner/clients/:id error", err);
        return jsonResponse({ ok: false, error: String(err) }, 500);
      }
    }

    // Runtime config JS for client-side (inject NEXT_PUBLIC_* values)
    if (req.method === "GET" && pathname === "/config.js") {
      // Only expose NEXT_PUBLIC_* and non-sensitive runtime settings
      const env = (Deno.env.toObject && Deno.env.toObject()) || {};
      const publicEnv: Record<string, string> = {};
      Object.keys(env).forEach((k) => {
        if (k.startsWith("NEXT_PUBLIC_")) publicEnv[k] = env[k];
      });
      // Add helpful, non-sensitive settings
      publicEnv["APP_ENV"] = Deno.env.get("APP_ENV") || "development";
      // Ensure the Next public keys are always present (fall back to server-side keys or placeholder)
      publicEnv["NEXT_PUBLIC_SUPABASE_URL"] = publicEnv["NEXT_PUBLIC_SUPABASE_URL"] || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "https://utivthfrwgtjatsusopw.supabase.co";
      publicEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = publicEnv["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "YOUR_SUPABASE_ANON_KEY_HERE";

      const js = `window.__ENV = ${JSON.stringify(publicEnv)};`;
      return new Response(js, {
        status: 200,
        headers: {
          "content-type": "application/javascript",
          "cache-control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Health endpoint
    if (req.method === "GET" && pathname === "/health") {
      const { hasRealSupabase } = await import("../bmad/agents/lib/supabase.ts");
      return jsonResponse({ ok: true, time: new Date().toISOString(), supabase: hasRealSupabase() });
    }

    return new Response("Not found", { status: 404 });
  },
  { port: PORT, hostname: HOST },
);
