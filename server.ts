// Deno HTTP server with Supabase PostgreSQL integration
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { authenticateRequest } from "./supabase_auth.ts";

// Database connection
// Prefer using an environment variable for DATABASE_URL. Avoid hardcoding
// credentials in the repo. If DATABASE_URL is not set we run in fallback
// (in-memory) mode and won't attempt a DB connection.
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "";

// Create client only when a DATABASE_URL is provided
let db: Client | null = null;
if (DATABASE_URL) {
  db = new Client(DATABASE_URL);
}

let dbConnected = false;

// Connect to database
async function connectDB() {
  try {
    if (!db) {
      console.log("ℹ️ No DATABASE_URL provided - skipping DB connection");
      return;
    }
    await db.connect();
    dbConnected = true;
    console.log("✅ Connected to Supabase PostgreSQL");
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    console.log("⚠️ Running in fallback mode (in-memory storage)");
  }
}

// Fallback in-memory storage (if DB unavailable)
const leads: Map<string, any> = new Map();
const outbox: Map<string, any> = new Map();
let leadCounter = 1;
let eventCounter = 1;

// Authentication middleware helper
async function requireAuth(
  req: Request,
  allowedRoles?: string[]
): Promise<
  { authorized: false; response: Response } | { authorized: true; auth: any }
> {
  const auth = await authenticateRequest(req);

  if (!auth) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - please log in" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      ),
    };
  }

  // Check role-based authorization if roles specified
  if (allowedRoles && !allowedRoles.includes(auth.profile.role)) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({
          ok: false,
          error: "Forbidden - insufficient permissions",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      ),
    };
  }

  return {
    authorized: true,
    auth,
  };
}

// Helper: save base64 image to file
async function saveBase64Image(
  dataUrl: string,
  filename: string
): Promise<void> {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid data URL");

  const base64Data = matches[2];
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  await Deno.mkdir("./web/uploads", { recursive: true });
  await Deno.writeFile(`./web/uploads/${filename}`, binaryData);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // POST /api/v1/quotes/estimate (owner dashboard quote calculator)
  if (url.pathname === "/api/v1/quotes/estimate" && req.method === "POST") {
    // Require owner authentication
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const body = await req.json();
      // Basic validation
      const address = (body.address || "").trim();
      const lawnSize = parseInt(body.lawn_size, 10);
      const serviceType = (body.service_type || "").trim();
      if (!address || !lawnSize || !serviceType) {
        return new Response(
          JSON.stringify({ ok: false, error: "All fields are required." }),
          { status: 400, headers }
        );
      }
      // Service area validation (River Parishes: St. John the Baptist, St. Charles, St. James)
      const allowedAreas = [
        /laplace/i,
        /norco/i,
        /reserve/i,
        /garyville/i,
        /edgard/i,
        /mount\s?air/i,
        /luling/i,
        /destrehan/i,
        /hahnville/i,
        /paradis/i,
        /killona/i,
        /st\.\s?rose/i,
        /boutte/i,
        /lutcher/i,
        /gramercy/i,
        /convent/i,
        /paulina/i,
        /vacherie/i,
        /st\.\s?james/i,
        /river\s?parish/i,
        /st\.?\s?john/i,
        /st\.?\s?charles/i,
        /st\.?\s?james/i,
      ];
      const inArea = allowedAreas.some((r) => r.test(address));
      if (!inArea) {
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              "Address must be in the River Parishes (St. John, St. Charles, or St. James Parish, LA).",
          }),
          { status: 400, headers }
        );
      }
      // Simple price heuristics (can be replaced with more advanced logic)
      let base = 50;
      if (serviceType === "weekly") base = 75;
      if (serviceType === "flower-bed") base = 150;
      if (serviceType === "spring-cleaning") base = 120;
      if (serviceType === "leaf-debris") base = 100;
      if (serviceType === "tractor") base = 200;
      // Adjust for lawn size
      let multiplier = 1;
      if (lawnSize > 4000) multiplier = 1.5;
      else if (lawnSize > 2500) multiplier = 1.2;
      else if (lawnSize < 1000) multiplier = 0.8;
      const priceLow = Math.round(base * multiplier);
      const priceHigh = Math.round(priceLow * 1.25);
      // Notes for user
      let notes = "";
      if (serviceType === "weekly")
        notes = "Includes mowing, edging, and blowing.";
      if (serviceType === "flower-bed")
        notes = "Includes weed removal and bed prep.";
      if (serviceType === "tractor") notes = "Heavy-duty lot clearing.";
      // Return result
      return new Response(
        JSON.stringify({
          ok: true,
          price_low: priceLow,
          price_high: priceHigh,
          notes,
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error in quote calculator:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // Authentication is handled by Supabase Auth
  // Users should authenticate through the login page which uses Supabase client-side SDK
  // The frontend will obtain a JWT token from Supabase and include it in the Authorization header
  // All protected API endpoints verify this JWT using the authenticateRequest middleware

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Serve static files
  if (url.pathname.startsWith("/static/")) {
    const response = await serveDir(req, { fsRoot: "./web", urlRoot: "" });
    // Add cache control headers - don't cache HTML files
    if (url.pathname.endsWith(".html")) {
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
    return response;
  }

  // Health check for Supabase connectivity/configuration
  if (url.pathname === "/health") {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ||
      "";
    const supabaseAnon =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      "";
    let reachable = false;
    if (supabaseUrl) {
      try {
        const res = await fetch(supabaseUrl, { method: "HEAD" });
        reachable = res.ok;
      } catch (e) {
        reachable = false;
      }
    }
    return new Response(
      JSON.stringify({
        ok: true,
        supabase: {
          configured: !!(supabaseUrl && supabaseAnon),
          url: supabaseUrl
            ? supabaseUrl.replace(/:\/\/([^@]+@)?/, "https://")
            : "",
          reachable,
        },
      }),
      { status: 200, headers }
    );
  }

  // Runtime config JS for client-side (inject NEXT_PUBLIC_* values)
  if (url.pathname === "/config.js") {
    const publicUrl =
      Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ||
      Deno.env.get("SUPABASE_URL") ||
      "";
    const publicAnon =
      Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      "";

    const js = `window.__ENV = { NEXT_PUBLIC_SUPABASE_URL: ${JSON.stringify(
      publicUrl
    )}, NEXT_PUBLIC_SUPABASE_ANON_KEY: ${JSON.stringify(publicAnon)} };`;

    return new Response(js, {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      }),
    });
  }

  // Serve uploads
  if (url.pathname.startsWith("/uploads/")) {
    return serveDir(req, { fsRoot: "./web", urlRoot: "" });
  }

  // Redirect root to home page with cache-busting
  if (url.pathname === "/") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/static/home.html?v=${Date.now()}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  // Serve HTML files from root path (e.g., /home.html -> /web/static/home.html)
  if (url.pathname.endsWith(".html") && !url.pathname.startsWith("/static/")) {
    try {
      const filePath = `./web/static${url.pathname}`;
      const file = await Deno.readFile(filePath);
      return new Response(file, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } catch (_error) {
      // File not found, will fall through to 404
    }
  }

  // Serve other static assets from root (CSS, JS, images, etc.)
  if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/static/")) {
    const ext = url.pathname.split(".").pop()?.toLowerCase();
    const staticExtensions = ["css", "js", "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "woff", "woff2", "ttf", "json"];

    if (ext && staticExtensions.includes(ext)) {
      try {
        const filePath = `./web/static${url.pathname}`;
        const file = await Deno.readFile(filePath);
        const contentTypes: Record<string, string> = {
          css: "text/css",
          js: "application/javascript",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          svg: "image/svg+xml",
          ico: "image/x-icon",
          webp: "image/webp",
          woff: "font/woff",
          woff2: "font/woff2",
          ttf: "font/ttf",
          json: "application/json",
        };

        return new Response(file, {
          status: 200,
          headers: {
            "Content-Type": contentTypes[ext] || "application/octet-stream",
            "Cache-Control": ext === "html" ? "no-cache" : "public, max-age=31536000",
          },
        });
      } catch (_error) {
        // File not found, will fall through to 404
      }
    }
  }

  // ==================== API ROUTES ====================

  // POST /api/leads (worker applications or inquiries)
  if (url.pathname === "/api/leads" && req.method === "POST") {
    try {
      const body = await req.json();

      // Validation
      if (!body.name || body.name.trim().length < 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Name must be at least 2 characters",
          }),
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

      const source = body.source || "web";
      const isApplication = source === "careers";

      if (dbConnected) {
        // Save to database
        const result = await db.queryObject(
          `
          INSERT INTO applications (name, phone, email, notes, source, status)
          VALUES ($1, $2, $3, $4, $5, 'pending')
          RETURNING id
        `,
          [
            body.name.trim(),
            body.phone.trim(),
            body.email.trim(),
            body.notes?.trim() || "",
            source,
          ]
        );

        const id = (result.rows[0] as any).id;

        // Add to outbox
        await db.queryObject(
          `
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ($1, $2, $3, 'pending')
        `,
          ["LEAD_CREATED", id, JSON.stringify(body)]
        );

        console.log(
          `[server] ${isApplication ? "Application" : "Lead"} created: ${id}`
        );
        return new Response(JSON.stringify({ ok: true, id }), {
          status: 201,
          headers,
        });
      } else {
        // Fallback to in-memory
        const id = `lead-${leadCounter++}`;
        const lead = {
          id,
          name: body.name.trim(),
          phone: body.phone.trim(),
          email: body.email.trim(),
          notes: body.notes ? body.notes.trim() : "",
          source,
          created_at: new Date().toISOString(),
        };
        leads.set(id, lead);

        const eventId = `event-${eventCounter++}`;
        outbox.set(eventId, {
          id: eventId,
          type: "LEAD_CREATED",
          ref_id: id,
          payload: lead,
          created_at: new Date().toISOString(),
        });

        console.log(
          `[server] ${isApplication ? "Application" : "Lead"} created (in-memory): ${id}`
        );
        return new Response(JSON.stringify({ ok: true, id }), {
          status: 201,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error creating lead:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/status (dashboard data)
  if (url.pathname === "/api/status" && req.method === "GET") {
    // Require owner authentication
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (dbConnected) {
        // Get from database
        const leadsResult = await db.queryObject(`
          SELECT id, name, phone, email, notes, source, created_at
          FROM applications
          ORDER BY created_at DESC
          LIMIT 100
        `);

        const eventsResult = await db.queryObject(`
          SELECT id, event_type as type, ref_id, payload, status, created_at
          FROM outbox_events
          WHERE status = 'pending'
          ORDER BY created_at DESC
          LIMIT 100
        `);

        const data = {
          ok: true,
          leads: leadsResult.rows,
          pending: eventsResult.rows,
        };
        return new Response(JSON.stringify(data), { status: 200, headers });
      } else {
        // Fallback to in-memory
        const data = {
          ok: true,
          leads: Array.from(leads.values()),
          pending: Array.from(outbox.values()),
        };
        return new Response(JSON.stringify(data), { status: 200, headers });
      }
    } catch (err) {
      console.error("[server] Error getting status:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/crew/:id/jobs (crew daily jobs)
  if (
    url.pathname.match(/^\/api\/crew\/[^\/]+\/jobs$/) &&
    req.method === "GET"
  ) {
    // Require crew or owner authentication
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const crewId = url.pathname.split("/")[3];

      // Ensure crew can only access their own jobs (unless they're an owner)
      if (
        authCheck.auth.profile.role === "crew" &&
        authCheck.auth.profile.id !== crewId
      ) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Forbidden - can only access own jobs",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      if (dbConnected) {
        const result = await db.queryObject(
          `
          SELECT * FROM get_crew_jobs($1, CURRENT_DATE)
        `,
          [crewId]
        );

        return new Response(JSON.stringify({ ok: true, jobs: result.rows }), {
          status: 200,
          headers,
        });
      } else {
        // Mock data for demo
        const mockJobs = [
          {
            id: "job-001",
            client_name: "Sarah Martinez",
            property_address: "123 Oak Street, Austin TX",
            scheduled_time: "08:00",
            services: ["Mowing", "Edging", "Trimming"],
            notes: "Gate code: 1234",
            status: "assigned",
          },
        ];
        return new Response(JSON.stringify({ ok: true, jobs: mockJobs }), {
          status: 200,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error getting crew jobs:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/metrics (business KPIs)
  if (url.pathname === "/api/owner/metrics" && req.method === "GET") {
    // Require owner authentication
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (dbConnected) {
        const result = await db.queryObject(
          `SELECT get_owner_metrics() as metrics`
        );
        const metrics = (result.rows[0] as any).metrics;

        return new Response(JSON.stringify({ ok: true, ...metrics }), {
          status: 200,
          headers,
        });
      } else {
        // Mock metrics
        const mockMetrics = {
          ok: true,
          active_crew: 6,
          new_applications: 12,
          jobs_this_week: 42,
          photos_today: 18,
          total_clients: 24,
        };
        return new Response(JSON.stringify(mockMetrics), {
          status: 200,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error getting owner metrics:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/crew-performance (crew performance metrics)
  if (url.pathname === "/api/owner/crew-performance" && req.method === "GET") {
    // Require owner authentication
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (dbConnected) {
        const result = await db.queryObject(
          `SELECT * FROM get_crew_performance()`
        );

        return new Response(
          JSON.stringify({ ok: true, crew: result.rows }),
          {
            status: 200,
            headers,
          }
        );
      } else {
        // Mock crew performance data
        const mockCrew = [
          {
            crew_id: "crew-001",
            crew_name: "Marcus T.",
            crew_role: "crew",
            jobs_completed: 42,
            jobs_this_week: 12,
            photos_uploaded: 84,
            avg_rating: 4.8,
            status: "active",
          },
          {
            crew_id: "crew-002",
            crew_name: "Priya K.",
            crew_role: "crew",
            jobs_completed: 38,
            jobs_this_week: 10,
            photos_uploaded: 76,
            avg_rating: 4.9,
            status: "active",
          },
        ];
        return new Response(JSON.stringify({ ok: true, crew: mockCrew }), {
          status: 200,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error getting crew performance:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/client/:id/dashboard (client portal data)
  if (
    url.pathname.match(/^\/api\/client\/[^\/]+\/dashboard$/) &&
    req.method === "GET"
  ) {
    // Require client or owner authentication
    const authCheck = await requireAuth(req, ["client", "owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const clientId = url.pathname.split("/")[3];

      // Ensure clients can only access their own dashboard (unless they're an owner)
      if (authCheck.auth.profile.role === "client") {
        // Get the client's actual client_id from the clients table
        if (dbConnected) {
          const clientResult = await db.queryObject(
            `SELECT id FROM clients WHERE user_id = $1`,
            [authCheck.auth.profile.id]
          );

          if (
            clientResult.rows.length === 0 ||
            (clientResult.rows[0] as any).id !== clientId
          ) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Forbidden - can only access own dashboard",
              }),
              {
                status: 403,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }
        }
      }

      if (dbConnected) {
        const result = await db.queryObject(
          `
          SELECT get_client_dashboard($1) as data
        `,
          [clientId]
        );

        const data = (result.rows[0] as any).data;
        return new Response(JSON.stringify({ ok: true, ...data }), {
          status: 200,
          headers,
        });
      } else {
        // Mock client data
        const mockData = {
          ok: true,
          client: {
            name: "Sarah Martinez",
            address: "123 Oak Street, Austin TX",
          },
          balance_due: 125.0,
          recent_jobs: [
            {
              id: "job-001",
              scheduled_date: "2025-11-05",
              services: ["Mowing", "Edging"],
              status: "completed",
            },
          ],
          photos: [
            {
              id: 1,
              photo_type: "before",
              photo_url:
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
              job_date: "2025-11-05",
            },
            {
              id: 2,
              photo_type: "after",
              photo_url:
                "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400",
              job_date: "2025-11-05",
            },
          ],
        };
        return new Response(JSON.stringify(mockData), { status: 200, headers });
      }
    } catch (err) {
      console.error("[server] Error getting client dashboard:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/jobs/:id/photo (crew photo upload)
  const photoMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/photo$/);
  if (photoMatch && req.method === "POST") {
    // Require crew or owner authentication
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return authCheck.response;

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

      if (dbConnected) {
        // Save to database
        await db.queryObject(
          `
          INSERT INTO job_photos (job_id, photo_type, photo_url, photo_storage_path)
          VALUES ($1, $2, $3, $4)
        `,
          [jobId, body.type || "after", path, filename]
        );

        // Add event
        await db.queryObject(
          `
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ('PHOTO_UPLOADED', $1, $2, 'pending')
        `,
          [
            jobId,
            JSON.stringify({
              photo_path: path,
              job_id: jobId,
              type: body.type,
            }),
          ]
        );
      } else {
        // Fallback to outbox
        const eventId = `event-${eventCounter++}`;
        outbox.set(eventId, {
          id: eventId,
          type: "PHOTO_UPLOADED",
          ref_id: jobId,
          payload: { photo_path: path, job_id: jobId },
          created_at: new Date().toISOString(),
        });
      }

      console.log(`[server] Photo uploaded for job ${jobId}: ${path}`);
      return new Response(JSON.stringify({ ok: true, id: jobId, path }), {
        status: 200,
        headers,
      });
    } catch (err) {
      console.error("[server] Error uploading photo:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Upload failed" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/jobs/:id/complete (mark job done)
  const completeMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/complete$/);
  if (completeMatch && req.method === "PATCH") {
    // Require crew or owner authentication
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const jobId = completeMatch[1];

      if (dbConnected) {
        await db.queryObject(
          `
          UPDATE jobs
          SET status = 'completed', completed_at = NOW()
          WHERE id = $1
        `,
          [jobId]
        );

        console.log(`[server] Job completed: ${jobId}`);
        return new Response(JSON.stringify({ ok: true, id: jobId }), {
          status: 200,
          headers,
        });
      } else {
        // Mock success for demo
        return new Response(JSON.stringify({ ok: true, id: jobId }), {
          status: 200,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error completing job:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/outbox (manual event creation)
  if (url.pathname === "/api/outbox" && req.method === "POST") {
    try {
      const body = await req.json();

      if (!body.type) {
        return new Response(
          JSON.stringify({ ok: false, error: "Event type is required" }),
          { status: 400, headers }
        );
      }

      if (dbConnected) {
        const result = await db.queryObject(
          `
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ($1, $2, $3, 'pending')
          RETURNING id
        `,
          [body.type, body.ref_id || "", JSON.stringify(body.payload || {})]
        );

        const id = (result.rows[0] as any).id;
        console.log(`[server] Outbox event created: ${id} (${body.type})`);
        return new Response(JSON.stringify({ ok: true, id }), {
          status: 201,
          headers,
        });
      } else {
        const id = `event-${eventCounter++}`;
        const event = {
          id,
          type: body.type,
          ref_id: body.ref_id || "",
          payload: body.payload || {},
          created_at: new Date().toISOString(),
        };
        outbox.set(id, event);
        console.log(
          `[server] Outbox event created (in-memory): ${id} (${body.type})`
        );
        return new Response(JSON.stringify({ ok: true, id }), {
          status: 201,
          headers,
        });
      }
    } catch (err) {
      console.error("[server] Error creating outbox event:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/waitlist - collect waitlist signups (name, email, service)
  if (url.pathname === "/api/waitlist" && req.method === "POST") {
    try {
      const body = await req.json();

      if (!body.name || body.name.trim().length < 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Name must be at least 2 characters",
          }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }

      const record = {
        id: `wait_${Date.now()}`,
        name: body.name.trim(),
        email: body.email.trim(),
        service: body.service || "general",
        notes: body.notes ? String(body.notes).trim() : "",
        created_at: new Date().toISOString(),
      };

      if (dbConnected) {
        // Save to applications table with source=waitlist if available
        try {
          const result = await db.queryObject(
            `INSERT INTO applications (name, phone, email, notes, source, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [
              record.name,
              "",
              record.email,
              `waitlist:${record.service} ${record.notes}`,
              "waitlist",
            ]
          );
          const id = (result.rows[0] as any).id;
          return new Response(JSON.stringify({ ok: true, id }), {
            status: 201,
            headers,
          });
        } catch (dbErr) {
          console.error("[server] DB insert error for waitlist:", dbErr);
          // fallback to file below
        }
      }

      // File-backed dev DB fallback: append to bmad/agents/dev_db.json and add outbox event
      try {
        const dbPath = "./bmad/agents/dev_db.json";
        let file = "{}";
        try {
          file = await Deno.readTextFile(dbPath);
        } catch (e) {
          // If file doesn't exist, create a basic structure
          file = JSON.stringify(
            { waitlist: [], leads: [], events_outbox: [], invoices: [] },
            null,
            2
          );
        }
        const json = JSON.parse(file || "{}");
        if (!Array.isArray(json.waitlist)) json.waitlist = [];
        json.waitlist.push(record);
        // Add outbox event for downstream processing
        if (!Array.isArray(json.events_outbox)) json.events_outbox = [];
        json.events_outbox.push({
          id: `evt_${Date.now()}`,
          type: "WAITLIST_SIGNUP",
          created_at: new Date().toISOString(),
          payload: record,
          status: "pending",
        });
        await Deno.writeTextFile(dbPath, JSON.stringify(json, null, 2));
        return new Response(JSON.stringify({ ok: true, id: record.id }), {
          status: 201,
          headers,
        });
      } catch (fileErr) {
        console.error("[server] Error writing waitlist to dev_db:", fileErr);
        return new Response(
          JSON.stringify({ ok: false, error: "Internal server error" }),
          { status: 500, headers }
        );
      }
    } catch (err) {
      console.error("[server] Error handling waitlist:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/careers/apply (careers application submission)
  if (url.pathname === "/api/careers/apply" && req.method === "POST") {
    try {
      const body = await req.json();

      // Validation
      if (!body.name || body.name.trim().length < 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Name must be at least 2 characters",
          }),
          { status: 400, headers }
        );
      }
      if (!body.phone || body.phone.trim().length < 10) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Valid phone number is required",
          }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }
      if (
        !body.position ||
        !["field-worker", "crew-lead"].includes(body.position)
      ) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Please select a valid position",
          }),
          { status: 400, headers }
        );
      }

      const positionName =
        body.position === "field-worker" ? "Field Worker" : "Crew Lead";
      const record = {
        id: `career_${Date.now()}`,
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email.trim(),
        position: positionName,
        created_at: new Date().toISOString(),
      };

      if (dbConnected) {
        // Save to applications table with source=careers
        try {
          const result = await db.queryObject(
            `INSERT INTO applications (name, phone, email, notes, source, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [
              record.name,
              record.phone,
              record.email,
              `Position: ${record.position}`,
              "careers",
            ]
          );
          const id = (result.rows[0] as any).id;
          return new Response(JSON.stringify({ ok: true, id }), {
            status: 201,
            headers,
          });
        } catch (dbErr) {
          console.error("[server] DB insert error for careers:", dbErr);
          // fallback to file below
        }
      }

      // Fallback: write to dev_db.json
      try {
        const dbPath = "./dev_db.json";
        let json: any = {};
        try {
          const data = await Deno.readTextFile(dbPath);
          json = JSON.parse(data);
        } catch {
          json = { applications: [], events_outbox: [] };
        }
        if (!json.applications) json.applications = [];
        if (!json.events_outbox) json.events_outbox = [];
        json.applications.push({
          ...record,
          source: "careers",
          status: "pending",
        });
        json.events_outbox.push({
          id: `evt_${Date.now()}`,
          type: "CAREERS_APPLICATION",
          created_at: new Date().toISOString(),
          payload: record,
          status: "pending",
        });
        await Deno.writeTextFile(dbPath, JSON.stringify(json, null, 2));
        return new Response(JSON.stringify({ ok: true, id: record.id }), {
          status: 201,
          headers,
        });
      } catch (fileErr) {
        console.error(
          "[server] Error writing careers application to dev_db:",
          fileErr
        );
        return new Response(
          JSON.stringify({ ok: false, error: "Internal server error" }),
          { status: 500, headers }
        );
      }
    } catch (err) {
      console.error("[server] Error handling careers application:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/service-inquiry (service inquiry from home page)
  if (url.pathname === "/api/service-inquiry" && req.method === "POST") {
    try {
      const body = await req.json();

      // Validation
      if (!body.firstName || body.firstName.trim().length < 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "First name must be at least 2 characters",
          }),
          { status: 400, headers }
        );
      }
      if (!body.lastName || body.lastName.trim().length < 2) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Last name must be at least 2 characters",
          }),
          { status: 400, headers }
        );
      }
      if (!body.phone || body.phone.trim().length < 10) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Valid phone number is required",
          }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }
      if (!body.address || body.address.trim().length < 5) {
        return new Response(
          JSON.stringify({ ok: false, error: "Service address is required" }),
          { status: 400, headers }
        );
      }
      if (!body.service || body.service.trim().length < 2) {
        return new Response(
          JSON.stringify({ ok: false, error: "Service type is required" }),
          { status: 400, headers }
        );
      }

      const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`;
      const record = {
        id: `service_${Date.now()}`,
        name: fullName,
        phone: body.phone.trim(),
        email: body.email.trim(),
        address: body.address.trim(),
        service: body.service.trim(),
        created_at: new Date().toISOString(),
      };

      if (dbConnected) {
        // Save to applications table with source=service-inquiry
        try {
          const result = await db.queryObject(
            `INSERT INTO applications (name, phone, email, notes, source, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
            [
              record.name,
              record.phone,
              record.email,
              `Service: ${record.service}\nAddress: ${record.address}`,
              "service-inquiry",
            ]
          );
          const id = (result.rows[0] as any).id;
          return new Response(JSON.stringify({ ok: true, id }), {
            status: 201,
            headers,
          });
        } catch (dbErr) {
          console.error("[server] DB insert error for service inquiry:", dbErr);
          // fallback to file below
        }
      }

      // Fallback: write to dev_db.json
      try {
        const dbPath = "./dev_db.json";
        let json: any = {};
        try {
          const data = await Deno.readTextFile(dbPath);
          json = JSON.parse(data);
        } catch {
          json = { applications: [], events_outbox: [] };
        }
        if (!json.applications) json.applications = [];
        if (!json.events_outbox) json.events_outbox = [];
        json.applications.push({
          ...record,
          source: "service-inquiry",
          status: "pending",
        });
        json.events_outbox.push({
          id: `evt_${Date.now()}`,
          type: "SERVICE_INQUIRY",
          created_at: new Date().toISOString(),
          payload: record,
          status: "pending",
        });
        await Deno.writeTextFile(dbPath, JSON.stringify(json, null, 2));
        return new Response(JSON.stringify({ ok: true, id: record.id }), {
          status: 201,
          headers,
        });
      } catch (fileErr) {
        console.error(
          "[server] Error writing service inquiry to dev_db:",
          fileErr
        );
        return new Response(
          JSON.stringify({ ok: false, error: "Internal server error" }),
          { status: 500, headers }
        );
      }
    } catch (err) {
      console.error("[server] Error handling service inquiry:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== CLIENT MANAGEMENT API ====================

  // POST /api/owner/clients - Create new client
  if (url.pathname === "/api/owner/clients" && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const body = await req.json();

      // Validation
      if (!body.name || body.name.trim().length < 2) {
        return new Response(
          JSON.stringify({ ok: false, error: "Name must be at least 2 characters" }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }
      if (!body.property_address || body.property_address.trim().length < 5) {
        return new Response(
          JSON.stringify({ ok: false, error: "Property address is required" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Check if email already exists
      const emailCheck = await db.queryObject(
        `SELECT id FROM users WHERE email = $1`,
        [body.email.trim()]
      );

      if (emailCheck.rows.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Email already exists" }),
          { status: 409, headers }
        );
      }

      // Create user record first
      const userResult = await db.queryObject(
        `INSERT INTO users (email, phone, name, role, status)
         VALUES ($1, $2, $3, 'client', 'active')
         RETURNING id`,
        [
          body.email.trim(),
          body.phone?.trim() || "",
          body.name.trim(),
        ]
      );

      const userId = (userResult.rows[0] as any).id;

      // Create client record
      const clientResult = await db.queryObject(
        `INSERT INTO clients (
          user_id,
          property_address,
          property_city,
          property_state,
          property_zip,
          service_plan,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id`,
        [
          userId,
          body.property_address.trim(),
          body.property_city?.trim() || "",
          body.property_state?.trim() || "",
          body.property_zip?.trim() || "",
          body.service_plan || "weekly",
        ]
      );

      const clientId = (clientResult.rows[0] as any).id;

      console.log(`[server] Client created: ${clientId} (${body.name})`);

      return new Response(
        JSON.stringify({
          ok: true,
          client_id: clientId,
          user_id: userId
        }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error creating client:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/clients - List all clients
  if (url.pathname === "/api/owner/clients" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get query parameters for search/filter
      const searchParams = url.searchParams;
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status") || "";

      let query = `
        SELECT
          c.id,
          c.user_id,
          u.name,
          u.email,
          u.phone,
          c.property_address,
          c.property_city,
          c.property_state,
          c.property_zip,
          c.service_plan,
          c.balance_due,
          c.status,
          c.created_at,
          (SELECT COUNT(*) FROM jobs WHERE client_id = c.id) as total_jobs,
          (SELECT COUNT(*) FROM jobs WHERE client_id = c.id AND status = 'completed') as completed_jobs
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      // Add search filter
      if (search) {
        paramCount++;
        query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR c.property_address ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add status filter
      if (status) {
        paramCount++;
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY c.created_at DESC`;

      const result = await db.queryObject(query, params);

      return new Response(
        JSON.stringify({ ok: true, clients: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing clients:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/clients/:id - Get client details
  if (url.pathname.match(/^\/api\/owner\/clients\/[^\/]+$/) && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const clientId = url.pathname.split("/")[4];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get client details with user info
      const clientResult = await db.queryObject(
        `SELECT
          c.*,
          u.name,
          u.email,
          u.phone,
          u.auth_user_id
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Client not found" }),
          { status: 404, headers }
        );
      }

      const client = clientResult.rows[0];

      // Get job history
      const jobsResult = await db.queryObject(
        `SELECT
          j.id,
          j.scheduled_date,
          j.scheduled_time,
          j.services,
          j.status,
          j.completed_at,
          u.name as crew_name
        FROM jobs j
        LEFT JOIN users u ON j.crew_id = u.id
        WHERE j.client_id = $1
        ORDER BY j.scheduled_date DESC
        LIMIT 50`,
        [clientId]
      );

      // Get invoices
      const invoicesResult = await db.queryObject(
        `SELECT
          i.id,
          i.invoice_number,
          i.amount,
          i.due_date,
          i.status,
          i.created_at,
          i.paid_at
        FROM invoices i
        WHERE i.client_id = $1
        ORDER BY i.created_at DESC
        LIMIT 50`,
        [clientId]
      );

      // Get payments
      const paymentsResult = await db.queryObject(
        `SELECT
          p.id,
          p.amount,
          p.payment_method,
          p.transaction_id,
          p.created_at,
          i.invoice_number
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        WHERE p.client_id = $1
        ORDER BY p.created_at DESC
        LIMIT 50`,
        [clientId]
      );

      return new Response(
        JSON.stringify({
          ok: true,
          client,
          jobs: jobsResult.rows,
          invoices: invoicesResult.rows,
          payments: paymentsResult.rows,
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error getting client details:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/clients/:id - Update client
  if (url.pathname.match(/^\/api\/owner\/clients\/[^\/]+$/) && req.method === "PATCH") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const clientId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get the user_id for this client
      const clientResult = await db.queryObject(
        `SELECT user_id FROM clients WHERE id = $1`,
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Client not found" }),
          { status: 404, headers }
        );
      }

      const userId = (clientResult.rows[0] as any).user_id;

      // Update user table if name, email, or phone provided
      if (body.name || body.email || body.phone) {
        const userUpdates: string[] = [];
        const userParams: any[] = [];
        let paramCount = 0;

        if (body.name) {
          paramCount++;
          userUpdates.push(`name = $${paramCount}`);
          userParams.push(body.name.trim());
        }
        if (body.email) {
          paramCount++;
          userUpdates.push(`email = $${paramCount}`);
          userParams.push(body.email.trim());
        }
        if (body.phone !== undefined) {
          paramCount++;
          userUpdates.push(`phone = $${paramCount}`);
          userParams.push(body.phone.trim());
        }

        if (userUpdates.length > 0) {
          paramCount++;
          userParams.push(userId);
          await db.queryObject(
            `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${paramCount}`,
            userParams
          );
        }
      }

      // Update clients table
      const clientUpdates: string[] = [];
      const clientParams: any[] = [];
      let paramCount = 0;

      if (body.property_address) {
        paramCount++;
        clientUpdates.push(`property_address = $${paramCount}`);
        clientParams.push(body.property_address.trim());
      }
      if (body.property_city !== undefined) {
        paramCount++;
        clientUpdates.push(`property_city = $${paramCount}`);
        clientParams.push(body.property_city.trim());
      }
      if (body.property_state !== undefined) {
        paramCount++;
        clientUpdates.push(`property_state = $${paramCount}`);
        clientParams.push(body.property_state.trim());
      }
      if (body.property_zip !== undefined) {
        paramCount++;
        clientUpdates.push(`property_zip = $${paramCount}`);
        clientParams.push(body.property_zip.trim());
      }
      if (body.service_plan) {
        paramCount++;
        clientUpdates.push(`service_plan = $${paramCount}`);
        clientParams.push(body.service_plan);
      }
      if (body.status) {
        paramCount++;
        clientUpdates.push(`status = $${paramCount}`);
        clientParams.push(body.status);
      }

      if (clientUpdates.length > 0) {
        paramCount++;
        clientParams.push(clientId);
        await db.queryObject(
          `UPDATE clients SET ${clientUpdates.join(", ")} WHERE id = $${paramCount}`,
          clientParams
        );
      }

      console.log(`[server] Client updated: ${clientId}`);

      return new Response(
        JSON.stringify({ ok: true, client_id: clientId }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error updating client:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== JOB MANAGEMENT API ====================

  // POST /api/owner/jobs - Create new job
  if (url.pathname === "/api/owner/jobs" && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const body = await req.json();

      // Validation
      if (!body.client_id) {
        return new Response(
          JSON.stringify({ ok: false, error: "Client ID is required" }),
          { status: 400, headers }
        );
      }
      if (!body.scheduled_date) {
        return new Response(
          JSON.stringify({ ok: false, error: "Scheduled date is required" }),
          { status: 400, headers }
        );
      }
      if (!body.services || !Array.isArray(body.services) || body.services.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "At least one service is required" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Create job
      const result = await db.queryObject(
        `INSERT INTO jobs (
          client_id,
          crew_id,
          scheduled_date,
          scheduled_time,
          services,
          notes,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'assigned')
        RETURNING id`,
        [
          body.client_id,
          body.crew_id || null,
          body.scheduled_date,
          body.scheduled_time || null,
          body.services,
          body.notes?.trim() || "",
        ]
      );

      const jobId = (result.rows[0] as any).id;

      console.log(`[server] Job created: ${jobId}`);

      return new Response(
        JSON.stringify({ ok: true, job_id: jobId }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error creating job:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/jobs - List all jobs
  if (url.pathname === "/api/owner/jobs" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get query parameters
      const searchParams = url.searchParams;
      const client_id = searchParams.get("client_id") || "";
      const crew_id = searchParams.get("crew_id") || "";
      const status = searchParams.get("status") || "";
      const date_from = searchParams.get("date_from") || "";
      const date_to = searchParams.get("date_to") || "";

      let query = `
        SELECT
          j.id,
          j.client_id,
          j.crew_id,
          j.scheduled_date,
          j.scheduled_time,
          j.services,
          j.notes,
          j.status,
          j.completed_at,
          j.created_at,
          c_user.name as client_name,
          c_client.property_address,
          crew.name as crew_name
        FROM jobs j
        LEFT JOIN clients c_client ON j.client_id = c_client.id
        LEFT JOIN users c_user ON c_client.user_id = c_user.id
        LEFT JOIN users crew ON j.crew_id = crew.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (client_id) {
        paramCount++;
        query += ` AND j.client_id = $${paramCount}`;
        params.push(client_id);
      }

      if (crew_id) {
        paramCount++;
        query += ` AND j.crew_id = $${paramCount}`;
        params.push(crew_id);
      }

      if (status) {
        paramCount++;
        query += ` AND j.status = $${paramCount}`;
        params.push(status);
      }

      if (date_from) {
        paramCount++;
        query += ` AND j.scheduled_date >= $${paramCount}`;
        params.push(date_from);
      }

      if (date_to) {
        paramCount++;
        query += ` AND j.scheduled_date <= $${paramCount}`;
        params.push(date_to);
      }

      query += ` ORDER BY j.scheduled_date DESC, j.scheduled_time ASC NULLS LAST`;

      const result = await db.queryObject(query, params);

      return new Response(
        JSON.stringify({ ok: true, jobs: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing jobs:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/jobs/:id - Get job details
  if (url.pathname.match(/^\/api\/owner\/jobs\/[^\/]+$/) && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const jobId = url.pathname.split("/")[4];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const jobResult = await db.queryObject(
        `SELECT
          j.*,
          c_user.name as client_name,
          c_user.email as client_email,
          c_user.phone as client_phone,
          c_client.property_address,
          c_client.property_city,
          c_client.property_state,
          c_client.property_zip,
          crew.name as crew_name,
          crew.email as crew_email
        FROM jobs j
        LEFT JOIN clients c_client ON j.client_id = c_client.id
        LEFT JOIN users c_user ON c_client.user_id = c_user.id
        LEFT JOIN users crew ON j.crew_id = crew.id
        WHERE j.id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Job not found" }),
          { status: 404, headers }
        );
      }

      const job = jobResult.rows[0];

      // Get photos for this job
      const photosResult = await db.queryObject(
        `SELECT
          jp.id,
          jp.photo_type,
          jp.photo_url,
          jp.created_at,
          u.name as uploaded_by_name
        FROM job_photos jp
        LEFT JOIN users u ON jp.uploaded_by = u.id
        WHERE jp.job_id = $1
        ORDER BY jp.created_at DESC`,
        [jobId]
      );

      return new Response(
        JSON.stringify({
          ok: true,
          job,
          photos: photosResult.rows,
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error getting job details:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/jobs/:id - Update job
  if (url.pathname.match(/^\/api\/owner\/jobs\/[^\/]+$/) && req.method === "PATCH") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const jobId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Build dynamic update query
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (body.client_id !== undefined) {
        paramCount++;
        updates.push(`client_id = $${paramCount}`);
        params.push(body.client_id);
      }

      if (body.crew_id !== undefined) {
        paramCount++;
        updates.push(`crew_id = $${paramCount}`);
        params.push(body.crew_id || null);
      }

      if (body.scheduled_date !== undefined) {
        paramCount++;
        updates.push(`scheduled_date = $${paramCount}`);
        params.push(body.scheduled_date);
      }

      if (body.scheduled_time !== undefined) {
        paramCount++;
        updates.push(`scheduled_time = $${paramCount}`);
        params.push(body.scheduled_time || null);
      }

      if (body.services !== undefined) {
        paramCount++;
        updates.push(`services = $${paramCount}`);
        params.push(body.services);
      }

      if (body.notes !== undefined) {
        paramCount++;
        updates.push(`notes = $${paramCount}`);
        params.push(body.notes);
      }

      if (body.status !== undefined) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        params.push(body.status);
      }

      if (updates.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "No fields to update" }),
          { status: 400, headers }
        );
      }

      paramCount++;
      params.push(jobId);

      await db.queryObject(
        `UPDATE jobs SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        params
      );

      console.log(`[server] Job updated: ${jobId}`);

      return new Response(
        JSON.stringify({ ok: true, job_id: jobId }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error updating job:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/jobs/:id/start - Start job (crew or owner)
  if (url.pathname.match(/^\/api\/jobs\/[^\/]+\/start$/) && req.method === "PATCH") {
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const jobId = url.pathname.split("/")[3];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      await db.queryObject(
        `UPDATE jobs SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [jobId]
      );

      console.log(`[server] Job started: ${jobId}`);

      return new Response(
        JSON.stringify({ ok: true, job_id: jobId }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error starting job:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/crew - List all crew members (for job assignment)
  if (url.pathname === "/api/owner/crew" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const result = await db.queryObject(
        `SELECT
          id,
          name,
          email,
          phone,
          status
        FROM users
        WHERE role = 'crew'
        ORDER BY name ASC`
      );

      return new Response(
        JSON.stringify({ ok: true, crew: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing crew:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== INVOICE MANAGEMENT API ====================

  // POST /api/owner/invoices - Create new invoice
  if (url.pathname === "/api/owner/invoices" && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const body = await req.json();

      if (!body.client_id) {
        return new Response(
          JSON.stringify({ ok: false, error: "Client ID is required" }),
          { status: 400, headers }
        );
      }
      if (!body.amount || parseFloat(body.amount) <= 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid amount is required" }),
          { status: 400, headers }
        );
      }
      if (!body.due_date) {
        return new Response(
          JSON.stringify({ ok: false, error: "Due date is required" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Generate invoice number
      const invoiceCount = await db.queryObject(
        `SELECT COUNT(*) as count FROM invoices`
      );
      const count = (invoiceCount.rows[0] as any).count;
      const invoiceNumber = `INV-${String(parseInt(count) + 1).padStart(5, "0")}`;

      // Create invoice
      const result = await db.queryObject(
        `INSERT INTO invoices (
          client_id,
          invoice_number,
          amount,
          due_date,
          line_items,
          status
        )
        VALUES ($1, $2, $3, $4, $5, 'unpaid')
        RETURNING id`,
        [
          body.client_id,
          invoiceNumber,
          parseFloat(body.amount),
          body.due_date,
          JSON.stringify(body.line_items || []),
        ]
      );

      const invoiceId = (result.rows[0] as any).id;

      // Update client balance
      await db.queryObject(
        `UPDATE clients SET balance_due = balance_due + $1 WHERE id = $2`,
        [parseFloat(body.amount), body.client_id]
      );

      console.log(`[server] Invoice created: ${invoiceNumber}`);

      return new Response(
        JSON.stringify({ ok: true, invoice_id: invoiceId, invoice_number: invoiceNumber }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error creating invoice:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/invoices - List all invoices
  if (url.pathname === "/api/owner/invoices" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const searchParams = url.searchParams;
      const client_id = searchParams.get("client_id") || "";
      const status = searchParams.get("status") || "";

      let query = `
        SELECT
          i.*,
          u.name as client_name,
          c.property_address
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (client_id) {
        paramCount++;
        query += ` AND i.client_id = $${paramCount}`;
        params.push(client_id);
      }

      if (status) {
        paramCount++;
        query += ` AND i.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY i.created_at DESC`;

      const result = await db.queryObject(query, params);

      return new Response(
        JSON.stringify({ ok: true, invoices: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing invoices:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== PAYMENT RECORDING API ====================

  // POST /api/owner/invoices/:id/payment - Record payment
  if (url.pathname.match(/^\/api\/owner\/invoices\/[^\/]+\/payment$/) && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return authCheck.response;

    try {
      const invoiceId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!body.amount || parseFloat(body.amount) <= 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid payment amount is required" }),
          { status: 400, headers }
        );
      }
      if (!body.payment_method) {
        return new Response(
          JSON.stringify({ ok: false, error: "Payment method is required" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get invoice details
      const invoiceResult = await db.queryObject(
        `SELECT client_id, amount, status FROM invoices WHERE id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invoice not found" }),
          { status: 404, headers }
        );
      }

      const invoice = invoiceResult.rows[0] as any;
      const paymentAmount = parseFloat(body.amount);

      // Create payment record
      const paymentResult = await db.queryObject(
        `INSERT INTO payments (
          invoice_id,
          client_id,
          amount,
          payment_method,
          transaction_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          invoiceId,
          invoice.client_id,
          paymentAmount,
          body.payment_method,
          body.transaction_id || "",
          body.notes || "",
        ]
      );

      const paymentId = (paymentResult.rows[0] as any).id;

      // Update invoice status
      const newStatus = paymentAmount >= parseFloat(invoice.amount) ? "paid" : "unpaid";
      await db.queryObject(
        `UPDATE invoices SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE NULL END WHERE id = $2`,
        [newStatus, invoiceId]
      );

      // Update client balance
      await db.queryObject(
        `UPDATE clients SET balance_due = balance_due - $1 WHERE id = $2`,
        [paymentAmount, invoice.client_id]
      );

      console.log(`[server] Payment recorded: ${paymentId} for invoice ${invoiceId}`);

      return new Response(
        JSON.stringify({ ok: true, payment_id: paymentId }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error recording payment:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // 404 for unknown routes
  return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
    status: 404,
    headers,
  });
}

const PORT = parseInt(Deno.env.get("PORT") || "8000");

// Connect to database before starting server
await connectDB();

console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
console.log(`🏠 Careers Page: http://0.0.0.0:${PORT}/`);
console.log(`🗺️ Portal Nav: http://0.0.0.0:${PORT}/static/portal-index.html`);
console.log(`👷 Crew Dashboard: http://0.0.0.0:${PORT}/static/crew.html`);
console.log(`📊 Owner Dashboard: http://0.0.0.0:${PORT}/static/owner.html`);
console.log(`👤 Client Portal: http://0.0.0.0:${PORT}/static/client.html`);
console.log(
  `💼 Hiring Dashboard: http://0.0.0.0:${PORT}/static/dashboard.html`
);

// Bind to 0.0.0.0 so Fly's proxy can reach the instance
serve(handler, { port: PORT, hostname: "0.0.0.0" });
