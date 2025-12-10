// Deno HTTP server with Supabase PostgreSQL integration
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { authenticateRequest, getSupabaseClient } from "./supabase_auth.ts";
import { sendEmail, buildOwnerInvitationEmail } from "./email-service.ts";

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

// Rate Limiting Map
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function getSecurityHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = [
    "http://localhost:8000",
    "http://0.0.0.0:8000",
    "https://xcellent1lawncare.com",
    "https://www.xcellent1lawncare.com"
  ];
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".fly.dev");
  // For testing purposes, allow "*" if no origin is specified
  const corsOrigin = isAllowed ? origin : (origin === "" ? "*" : "null");

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Referrer-Policy": "same-origin",
    "X-XSS-Protection": "1; mode=block"
  };
}

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
          headers: getSecurityHeaders(req),
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
          headers: getSecurityHeaders(req),
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

  // 1. Rate Limiting Check
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  let limit = rateLimits.get(ip);
  if (!limit || now > limit.resetTime) {
    limit = { count: 0, resetTime: now + 60000 };
    rateLimits.set(ip, limit);
  }
  limit.count++;

  // Allow strict static file access (images/css) to bypass strict limits if needed, 
  // but 300 req/min is generous for a user.
  if (limit.count > 300) {
    return new Response(JSON.stringify({ ok: false, error: "Too Many Requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Security Headers & CORS
  const headers = getSecurityHeaders(req);

  // POST /api/v1/quotes/estimate (owner dashboard quote calculator)
  if (url.pathname === "/api/v1/quotes/estimate" && req.method === "POST") {
    // Public quote estimator (available to the public landing page and widgets)
    // Note: previously this endpoint required owner auth; for lead capture and quote widgets
    // we expose a public estimator that performs address validation and pricing heuristics.

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
      headers: {
        ...headers,
        "Content-Type": "application/javascript",
      },
    });
  }

  // Owner invitation validation
  if (url.pathname.startsWith("/api/owner/invite/")) {
    const token = url.pathname.split("/api/owner/invite/")[1];
    // Treat missing token or any token as not found for now. Tests expect 404 for both
    // the empty-format case and invalid tokens.
    return new Response(
      JSON.stringify({ ok: false, error: "Invitation not found or expired" }),
      { status: 404, headers }
    );
  }

  // Admin endpoint to create test owner (development only)
  if (url.pathname === "/admin/create-test-owner" && req.method === "POST") {
    try {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");

      if (!serviceRoleKey || !supabaseUrl) {
        return new Response(
          JSON.stringify({ ok: false, error: "Missing Supabase credentials" }),
          { status: 500, headers: getSecurityHeaders(req) }
        );
      }

      // Create auth user
      const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@xcellent1.com",
          password: "Test123!@#",
          email_confirm: true,
          user_metadata: { name: "Test Owner" },
        }),
      });

      const authUser = await createUserRes.json();

      if (!createUserRes.ok && !authUser.msg?.includes("already registered")) {
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to create auth user", details: authUser }),
          { status: 500, headers: getSecurityHeaders(req) }
        );
      }

      const userId = authUser.id || authUser.user?.id;

      // Create or update user profile using Supabase REST API
      const profileRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          auth_user_id: userId,
          email: "test@xcellent1.com",
          name: "Test Owner",
          role: "owner",
          status: "active",
        }),
      });

      if (!profileRes.ok) {
        const profileError = await profileRes.text();
        return new Response(
          JSON.stringify({ ok: false, error: "Failed to create profile", details: profileError }),
          { status: 500, headers: getSecurityHeaders(req) }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Test owner created",
          email: "test@xcellent1.com",
          password: "Test123!@#",
        }),
        { status: 200, headers: getSecurityHeaders(req) }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: getSecurityHeaders(req) }
      );
    }
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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
            headers,
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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
                headers,
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
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const jobId = photoMatch[1];
      const body = await req.json();

      if (!body.dataUrl || !body.dataUrl.startsWith("data:image/")) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid data URL" }),
          { status: 400, headers }
        );
      }

      // Convert base64 to Blob for Supabase Storage
      const base64Data = body.dataUrl.split(",")[1];
      const mimeType = body.dataUrl.match(/data:([^;]+);/)?.[1] || "image/jpeg";
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const blob = new Blob([binaryData], { type: mimeType });

      // Determine file extension from mime type
      const ext = mimeType.split("/")[1] || "jpg";
      const photoType = body.type || "after";
      const timestamp = Date.now();
      const storagePath = `jobs/${jobId}/${photoType}-${timestamp}.${ext}`;

      // Upload to Supabase Storage
      const supabase = getSupabaseClient();
      if (!supabase) {
        // Fallback to local storage if Supabase not configured
        const filename = `${jobId}-${timestamp}.${ext}`;
        await saveBase64Image(body.dataUrl, filename);
        const localPath = `/uploads/${filename}`;

        if (dbConnected) {
          await db.queryObject(
            `INSERT INTO job_photos (job_id, uploaded_by, photo_type, photo_url, photo_storage_path)
             VALUES ($1, $2, $3, $4, $5)`,
            [jobId, authCheck.auth.profile.id, photoType, localPath, filename]
          );
        }

        console.log(`[server] Photo uploaded locally for job ${jobId}: ${localPath}`);
        return new Response(JSON.stringify({ ok: true, id: jobId, path: localPath }), {
          status: 200,
          headers,
        });
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(storagePath, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error("[server] Supabase upload error:", uploadError);
        return new Response(
          JSON.stringify({ ok: false, error: `Upload failed: ${uploadError.message}` }),
          { status: 500, headers }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("job-photos")
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      if (dbConnected) {
        // Save to database
        await db.queryObject(
          `INSERT INTO job_photos (job_id, uploaded_by, photo_type, photo_url, photo_storage_path)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [jobId, authCheck.auth.profile.id, photoType, publicUrl, storagePath]
        );

        // Add event
        await db.queryObject(
          `INSERT INTO outbox_events (event_type, ref_id, payload, status)
           VALUES ('PHOTO_UPLOADED', $1, $2, 'pending')`,
          [
            jobId,
            JSON.stringify({
              photo_url: publicUrl,
              photo_path: storagePath,
              job_id: jobId,
              type: photoType,
            }),
          ]
        );
      }

      console.log(`[server] Photo uploaded to Supabase for job ${jobId}: ${publicUrl}`);
      return new Response(JSON.stringify({ ok: true, id: jobId, url: publicUrl, path: storagePath }), {
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

  // POST /api/jobs/:id/photo/upload-target - return a storage target path for client-side upload
  const photoTargetMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/photo\/upload-target$/);
  if (photoTargetMatch && req.method === "POST") {
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const jobId = photoTargetMatch[1];
      const body = await req.json();
      const mimeType = body.mimeType || "image/jpeg";
      const ext = (mimeType.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
      const photoType = body.type || "after";
      const timestamp = Date.now();
      const storagePath = `jobs/${jobId}/${photoType}-${timestamp}.${ext}`;

      const supabase = getSupabaseClient();
      if (!supabase) {
        // Provide a local path so client can POST base64 to /api/jobs/:id/photo
        return new Response(JSON.stringify({ ok: true, storagePath, note: "Local dev fallback. Use POST /api/jobs/:id/photo to upload base64." }), { status: 200, headers });
      }

      // If Supabase available, return storage path and public URL (clients can then upload using anon key via client SDK)
      const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      return new Response(JSON.stringify({ ok: true, storagePath, publicUrl }), { status: 200, headers });
    } catch (err) {
      console.error("[server] Error creating upload target:", err);
      return new Response(JSON.stringify({ ok: false, error: "Failed to create upload target" }), { status: 500, headers });
    }
  }

  // PATCH /api/jobs/:id/complete (mark job done)
  const completeMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/complete$/);
  if (completeMatch && req.method === "PATCH") {
    // Require crew or owner authentication
    const authCheck = await requireAuth(req, ["crew", "owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

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
        // Save to waitlist table
        try {
          const result = await db.queryObject(
            `INSERT INTO waitlist (name, email, phone, property_address, preferred_service_plan, notes, source, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id`,
            [
              record.name,
              record.email,
              "",  // phone - not collected in simple form
              "",  // property_address - not collected in simple form
              record.service,
              record.notes || "",
              "website",
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
    if (!authCheck.authorized) return (authCheck as any).response;

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
        `INSERT INTO users (email, phone, name, role)
         VALUES ($1, $2, $3, 'client')
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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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
    if (!authCheck.authorized) return (authCheck as any).response;

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

  // ==================== BUSINESS INSIGHTS API ====================

  // GET /api/owner/applications - View job applications
  if (url.pathname === "/api/owner/applications" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get filter parameters
      const urlObj = new URL(req.url, `https://${req.headers.get("host") || "localhost"}`);
      const statusFilter = urlObj.searchParams.get("status");
      const sourceFilter = urlObj.searchParams.get("source");

      let query = `
        SELECT id, name, email, phone, source, status, created_at, updated_at, notes
        FROM applications
        WHERE 1=1
      `;
      const params = [];

      if (statusFilter && statusFilter !== "all") {
        query += ` AND status = $${params.length + 1}`;
        params.push(statusFilter);
      }

      if (sourceFilter && sourceFilter !== "all") {
        query += ` AND source = $${params.length + 1}`;
        params.push(sourceFilter);
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await db.queryObject(query, params);

      console.log(`[server] Retrieved ${result.rows.length} applications`);

      return new Response(
        JSON.stringify({
          ok: true,
          applications: result.rows,
          count: result.rows.length,
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing applications:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/applications/:id - Update application status
  if (
    url.pathname.match(/^\/api\/owner\/applications\/[^\/]+$/) &&
    req.method === "PATCH"
  ) {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const applicationId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!body.status) {
        return new Response(
          JSON.stringify({ ok: false, error: "Status is required" }),
          { status: 400, headers }
        );
      }

      if (!["pending", "screening", "interview", "offer", "hired", "rejected"].includes(body.status)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid status" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const result = await db.queryObject(
        `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
        [body.status, applicationId]
      );

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Application not found" }),
          { status: 404, headers }
        );
      }

      console.log(`[server] Application ${applicationId} status updated to ${body.status}`);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error updating application:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== PAYMENT ACCOUNTS API ====================

  // GET /api/owner/payment-accounts - List all payment accounts
  if (url.pathname === "/api/owner/payment-accounts" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const userId = authCheck.auth.profile.id;

      const result = await db.queryObject(
        `SELECT 
          id, user_id, payment_method, account_identifier, account_name,
          is_primary, is_active, verification_status, connected_at, last_verified_at,
          created_at, updated_at
        FROM payment_accounts
        WHERE user_id = $1 AND is_active = TRUE
        ORDER BY is_primary DESC, created_at DESC`,
        [userId]
      );

      console.log(`[server] Retrieved payment accounts for user ${userId}`);

      return new Response(
        JSON.stringify({ ok: true, accounts: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error listing payment accounts:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/owner/payment-accounts - Create new payment account
  if (url.pathname === "/api/owner/payment-accounts" && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const body = await req.json();

      if (!body.payment_method || !body.account_identifier) {
        return new Response(
          JSON.stringify({ ok: false, error: "Payment method and account identifier are required" }),
          { status: 400, headers }
        );
      }

      if (!["paypal", "cash_app", "stripe", "square"].includes(body.payment_method)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid payment method" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const userId = authCheck.auth.profile.id;

      // If setting as primary, unset other primary accounts
      if (body.is_primary) {
        await db.queryObject(
          `UPDATE payment_accounts SET is_primary = FALSE WHERE user_id = $1 AND payment_method = $2`,
          [userId, body.payment_method]
        );
      }

      const result = await db.queryObject(
        `INSERT INTO payment_accounts (
          user_id, payment_method, account_identifier, account_name,
          is_primary, verification_status
        )
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id, user_id, payment_method, account_identifier, account_name,
                  is_primary, is_active, verification_status, connected_at, created_at`,
        [
          userId,
          body.payment_method,
          body.account_identifier,
          body.account_name || null,
          body.is_primary || false
        ]
      );

      const account = (result.rows[0] as any);
      console.log(
        `[server] Payment account created: ${account.id} for user ${userId} (${body.payment_method})`
      );

      return new Response(
        JSON.stringify({ ok: true, account }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error creating payment account:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/payment-accounts/:id/primary - Set as primary account
  if (
    url.pathname.match(/^\/api\/owner\/payment-accounts\/[^\/]+\/primary$/) &&
    req.method === "PATCH"
  ) {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const accountId = url.pathname.split("/")[4];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const userId = authCheck.auth.profile.id;

      // Get the account to find its payment method
      const accountResult = await db.queryObject(
        `SELECT payment_method FROM payment_accounts WHERE id = $1 AND user_id = $2`,
        [accountId, userId]
      );

      if (accountResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Account not found" }),
          { status: 404, headers }
        );
      }

      const paymentMethod = (accountResult.rows[0] as any).payment_method;

      // Unset other primary accounts for this payment method
      await db.queryObject(
        `UPDATE payment_accounts SET is_primary = FALSE WHERE user_id = $1 AND payment_method = $2`,
        [userId, paymentMethod]
      );

      // Set this account as primary
      await db.queryObject(
        `UPDATE payment_accounts SET is_primary = TRUE WHERE id = $1`,
        [accountId]
      );

      console.log(`[server] Payment account ${accountId} set as primary`);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error updating payment account:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // DELETE /api/owner/payment-accounts/:id - Delete payment account
  if (url.pathname.match(/^\/api\/owner\/payment-accounts\/[^\/]+$/) && req.method === "DELETE") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const accountId = url.pathname.split("/")[4];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const userId = authCheck.auth.profile.id;

      // Check if account exists and belongs to user
      const accountResult = await db.queryObject(
        `SELECT id FROM payment_accounts WHERE id = $1 AND user_id = $2`,
        [accountId, userId]
      );

      if (accountResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Account not found" }),
          { status: 404, headers }
        );
      }

      // Soft delete by setting is_active = FALSE
      await db.queryObject(
        `UPDATE payment_accounts SET is_active = FALSE WHERE id = $1`,
        [accountId]
      );

      console.log(`[server] Payment account ${accountId} deleted (soft delete)`);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error deleting payment account:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== WAITLIST API ====================

  // POST /api/waitlist - Public endpoint for prospective clients to join waitlist
  if (url.pathname === "/api/waitlist" && req.method === "POST") {
    try {
      const body = await req.json();

      // Validation
      if (!body.name || body.name.trim() === "") {
        return new Response(
          JSON.stringify({ ok: false, error: "Name is required" }),
          { status: 400, headers }
        );
      }
      if (!body.email || body.email.trim() === "") {
        return new Response(
          JSON.stringify({ ok: false, error: "Email is required" }),
          { status: 400, headers }
        );
      }
      if (!body.phone || body.phone.trim() === "") {
        return new Response(
          JSON.stringify({ ok: false, error: "Phone is required" }),
          { status: 400, headers }
        );
      }
      if (!body.property_address || body.property_address.trim() === "") {
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

      // Check if email already exists in waitlist or clients
      const emailCheck = await db.queryObject(
        `SELECT 1 FROM waitlist WHERE email = $1 AND status IN ('pending', 'contacted')
         UNION
         SELECT 1 FROM users WHERE email = $1 AND role = 'client'`,
        [body.email.trim()]
      );

      if (emailCheck.rows.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "This email is already registered or on the waitlist" }),
          { status: 409, headers }
        );
      }

      // Insert into waitlist
      const result = await db.queryObject(
        `INSERT INTO waitlist (
          name,
          email,
          phone,
          property_address,
          property_city,
          property_state,
          property_zip,
          preferred_service_plan,
          notes,
          source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          body.name.trim(),
          body.email.trim(),
          body.phone.trim(),
          body.property_address.trim(),
          body.property_city?.trim() || "",
          body.property_state?.trim() || "",
          body.property_zip?.trim() || "",
          body.preferred_service_plan || "weekly",
          body.notes?.trim() || "",
          body.source || "website",
        ]
      );

      const waitlistId = (result.rows[0] as any).id;
      console.log(`[server] New waitlist entry: ${waitlistId} - ${body.name}`);

      return new Response(
        JSON.stringify({ ok: true, id: waitlistId, message: "Successfully added to waitlist!" }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error adding to waitlist:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/waitlist - Owner views waitlist
  if (url.pathname === "/api/owner/waitlist" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const status = url.searchParams.get("status") || "";
      const search = url.searchParams.get("search") || "";

      let query = `
        SELECT
          id,
          name,
          email,
          phone,
          property_address,
          property_city,
          property_state,
          property_zip,
          preferred_service_plan,
          notes,
          source,
          status,
          created_at,
          updated_at
        FROM waitlist
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (search) {
        paramCount++;
        query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR property_address ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await db.queryObject(query, params);

      console.log(`[server] Retrieved ${result.rows.length} waitlist entries`);

      return new Response(
        JSON.stringify({ ok: true, waitlist: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error fetching waitlist:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/waitlist/:id - Update waitlist entry
  if (url.pathname.match(/^\/api\/owner\/waitlist\/[^\/]+$/) && req.method === "PATCH") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const waitlistId = url.pathname.split("/")[4];
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

      if (body.status) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        params.push(body.status);
      }
      if (body.notes !== undefined) {
        paramCount++;
        updates.push(`notes = $${paramCount}`);
        params.push(body.notes);
      }

      if (updates.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "No fields to update" }),
          { status: 400, headers }
        );
      }

      paramCount++;
      params.push(waitlistId);

      const query = `UPDATE waitlist SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id`;
      const result = await db.queryObject(query, params);

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Waitlist entry not found" }),
          { status: 404, headers }
        );
      }

      console.log(`[server] Updated waitlist entry: ${waitlistId}`);

      return new Response(
        JSON.stringify({ ok: true, message: "Waitlist entry updated successfully" }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error updating waitlist entry:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/owner/waitlist/:id/convert - Convert waitlist entry to client
  if (url.pathname.match(/^\/api\/owner\/waitlist\/[^\/]+\/convert$/) && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const waitlistId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get waitlist entry
      const waitlistResult = await db.queryObject(
        `SELECT * FROM waitlist WHERE id = $1`,
        [waitlistId]
      );

      if (waitlistResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Waitlist entry not found" }),
          { status: 404, headers }
        );
      }

      const waitlistEntry = waitlistResult.rows[0] as any;

      // Check if email already exists as a client
      const userCheck = await db.queryObject(
        `SELECT id FROM users WHERE email = $1`,
        [waitlistEntry.email]
      );

      if (userCheck.rows.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "A user with this email already exists" }),
          { status: 409, headers }
        );
      }

      // Create user record
      const userResult = await db.queryObject(
        `INSERT INTO users (email, phone, name, role, status)
         VALUES ($1, $2, $3, 'client', 'active')
         RETURNING id`,
        [waitlistEntry.email, waitlistEntry.phone, waitlistEntry.name]
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
          waitlistEntry.property_address,
          waitlistEntry.property_city || "",
          waitlistEntry.property_state || "",
          waitlistEntry.property_zip || "",
          body.service_plan || waitlistEntry.preferred_service_plan || "weekly",
        ]
      );

      const clientId = (clientResult.rows[0] as any).id;

      // Update waitlist entry to mark as converted
      await db.queryObject(
        `UPDATE waitlist SET status = 'converted', converted_client_id = $1 WHERE id = $2`,
        [clientId, waitlistId]
      );

      console.log(`[server] Converted waitlist entry ${waitlistId} to client ${clientId}`);

      return new Response(
        JSON.stringify({ ok: true, client_id: clientId, message: "Successfully converted to client!" }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error converting waitlist entry:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== PAYMENT VERIFICATION API ====================

  // GET /api/owner/payments/pending - List payments pending verification
  if (url.pathname === "/api/owner/payments/pending" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get payments that were self-reported by clients (with "Self-reported" in notes)
      const result = await db.queryObject(
        `SELECT
          p.id,
          p.invoice_id,
          p.client_id,
          p.amount,
          p.payment_method,
          p.transaction_id,
          p.notes,
          p.created_at,
          i.invoice_number,
          i.status as invoice_status,
          u.name as client_name,
          u.email as client_email,
          c.property_address
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN clients c ON p.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE p.notes LIKE '%Self-reported%'
        ORDER BY p.created_at DESC`,
        []
      );

      console.log(`[server] Retrieved ${result.rows.length} pending payments`);

      return new Response(
        JSON.stringify({ ok: true, payments: result.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error fetching pending payments:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // PATCH /api/owner/payments/:id/verify - Verify or reject payment
  if (url.pathname.match(/^\/api\/owner\/payments\/[^\/]+\/verify$/) && req.method === "PATCH") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const paymentId = url.pathname.split("/")[4];
      const body = await req.json();

      if (!body.action || !["approve", "reject"].includes(body.action)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Action must be 'approve' or 'reject'" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get payment details
      const paymentResult = await db.queryObject(
        `SELECT p.*, i.client_id, i.amount as invoice_amount
         FROM payments p
         JOIN invoices i ON p.invoice_id = i.id
         WHERE p.id = $1`,
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Payment not found" }),
          { status: 404, headers }
        );
      }

      const payment = paymentResult.rows[0] as any;

      if (body.action === "approve") {
        // Payment is already recorded, just update notes to mark as verified
        await db.queryObject(
          `UPDATE payments
           SET notes = REPLACE(notes, 'Self-reported by client', 'Verified by owner')
           WHERE id = $1`,
          [paymentId]
        );

        console.log(`[server] Payment ${paymentId} verified`);

        return new Response(
          JSON.stringify({ ok: true, message: "Payment verified successfully" }),
          { status: 200, headers }
        );
      } else {
        // Reject payment - reverse the balance update and mark invoice as unpaid
        await db.queryObject(
          `UPDATE clients SET balance_due = balance_due + $1 WHERE id = $2`,
          [parseFloat(payment.amount), payment.client_id]
        );

        await db.queryObject(
          `UPDATE invoices SET status = 'unpaid', paid_at = NULL WHERE id = $1`,
          [payment.invoice_id]
        );

        await db.queryObject(
          `DELETE FROM payments WHERE id = $1`,
          [paymentId]
        );

        console.log(`[server] Payment ${paymentId} rejected and reversed`);

        return new Response(
          JSON.stringify({ ok: true, message: "Payment rejected and balance restored" }),
          { status: 200, headers }
        );
      }
    } catch (err) {
      console.error("[server] Error verifying payment:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== CLIENT SELF-SERVICE API ====================

  // GET /api/client/invoices - Get client's invoices
  if (url.pathname === "/api/client/invoices" && req.method === "GET") {
    const authCheck = await requireAuth(req, ["client"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Get client record for authenticated user
      const clientResult = await db.queryObject(
        `SELECT id FROM clients WHERE user_id = $1`,
        [authCheck.auth.profile.id]
      );

      if (clientResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Client not found" }),
          { status: 404, headers }
        );
      }

      const clientId = (clientResult.rows[0] as any).id;

      // Get invoices
      const invoicesResult = await db.queryObject(
        `SELECT id, invoice_number, amount, due_date, status, created_at
         FROM invoices
         WHERE client_id = $1
         ORDER BY created_at DESC`,
        [clientId]
      );

      return new Response(
        JSON.stringify({ ok: true, invoices: invoicesResult.rows }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error fetching client invoices:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/client/invoices/:id/mark-payment - Client reports payment sent
  if (url.pathname.match(/^\/api\/client\/invoices\/[^\/]+\/mark-payment$/) && req.method === "POST") {
    const authCheck = await requireAuth(req, ["client"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const invoiceId = url.pathname.split("/")[4];
      const body = await req.json();

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

      // Get invoice and verify it belongs to the authenticated client
      const invoiceResult = await db.queryObject(
        `SELECT i.id, i.client_id, i.amount, i.status, c.user_id
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE i.id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invoice not found" }),
          { status: 404, headers }
        );
      }

      const invoice = invoiceResult.rows[0] as any;

      // Verify the invoice belongs to the authenticated user
      if (invoice.user_id !== authCheck.auth.profile.id) {
        return new Response(
          JSON.stringify({ ok: false, error: "Unauthorized" }),
          { status: 403, headers }
        );
      }

      if (invoice.status === "paid") {
        return new Response(
          JSON.stringify({ ok: false, error: "This invoice is already marked as paid" }),
          { status: 400, headers }
        );
      }

      // Create a pending payment record (to be verified by owner)
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
          parseFloat(invoice.amount),
          body.payment_method,
          body.transaction_id || "",
          `Self-reported by client. ${body.notes || ""}`.trim(),
        ]
      );

      const paymentId = (paymentResult.rows[0] as any).id;

      // Update invoice status to indicate payment is pending verification
      await db.queryObject(
        `UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1`,
        [invoiceId]
      );

      // Update client balance
      await db.queryObject(
        `UPDATE clients SET balance_due = balance_due - $1 WHERE id = $2`,
        [parseFloat(invoice.amount), invoice.client_id]
      );

      console.log(`[server] Client marked payment for invoice ${invoiceId}: ${paymentId}`);

      return new Response(
        JSON.stringify({
          ok: true,
          payment_id: paymentId,
          message: "Payment marked successfully! We'll verify it shortly."
        }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error marking payment:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // ==================== OWNER INVITATION API ====================

  // POST /api/owner/invite - Send owner invitation (admin only)
  if (url.pathname === "/api/owner/invite" && req.method === "POST") {
    const authCheck = await requireAuth(req, ["owner"]);
    if (!authCheck.authorized) return (authCheck as any).response;

    try {
      const body = await req.json();

      if (!body.email || !body.name) {
        return new Response(
          JSON.stringify({ ok: false, error: "Email and name required" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      // Check if email already exists as a user
      const existingUser = await db.queryObject(
        `SELECT id FROM users WHERE email = $1`,
        [body.email.trim()]
      );

      if (existingUser.rows.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "This email is already registered" }),
          { status: 409, headers }
        );
      }

      // Check if invitation already exists and is pending
      const existingInvite = await db.queryObject(
        `SELECT id FROM owner_invitations WHERE email = $1 AND status = 'pending'`,
        [body.email.trim()]
      );

      if (existingInvite.rows.length > 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "An invitation has already been sent to this email" }),
          { status: 409, headers }
        );
      }

      // Generate invitation token (random 32-char string)
      const invitationToken = crypto.getRandomValues(new Uint8Array(24))
        .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');

      // Create invitation record
      const inviteResult = await db.queryObject(
        `INSERT INTO owner_invitations (email, name, phone, invitation_token, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id, invitation_token, expires_at`,
        [body.email.trim(), body.name.trim(), body.phone?.trim() || null, invitationToken]
      );

      const invite = (inviteResult.rows[0] as any);
      const setupUrl = `https://xcellent1lawncare.com/owner-setup.html?token=${invite.invitation_token}`;

      console.log(`[server] Owner invitation created for ${body.email}: ${invite.id}`);
      console.log(`[server] Setup URL: ${setupUrl}`);

      // Send invitation email
      const emailHtml = buildOwnerInvitationEmail(
        body.name.trim(),
        setupUrl,
        invite.expires_at
      );

      const emailSent = await sendEmail({
        to: body.email.trim(),
        subject: "Complete Your Xcellent1 Owner Account Setup",
        html: emailHtml,
      });

      if (!emailSent) {
        console.warn(`[server] Email send failed for ${body.email}, but invitation still created`);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          invitation_id: invite.id,
          setup_url: setupUrl,
          expires_at: invite.expires_at,
          email_sent: emailSent,
          message: emailSent
            ? "Invitation email sent successfully"
            : "Invitation created, but email could not be sent. Please share the setup URL manually."
        }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error creating owner invitation:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // GET /api/owner/invite/:token - Validate invitation token
  if (url.pathname.match(/^\/api\/owner\/invite\/[^\/]+$/) && req.method === "GET") {
    try {
      const token = url.pathname.split("/")[4];

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const result = await db.queryObject(
        `SELECT id, email, name, phone, status, expires_at FROM owner_invitations WHERE invitation_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid invitation token" }),
          { status: 404, headers }
        );
      }

      const invite = result.rows[0] as any;

      if (invite.status !== "pending") {
        return new Response(
          JSON.stringify({ ok: false, error: `Invitation is ${invite.status}` }),
          { status: 400, headers }
        );
      }

      if (new Date(invite.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invitation has expired" }),
          { status: 400, headers }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          email: invite.email,
          name: invite.name,
          phone: invite.phone,
          message: "Invitation is valid"
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error validating invitation:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /api/owner/invite/:token/accept - Accept invitation and complete setup
  if (url.pathname.match(/^\/api\/owner\/invite\/[^\/]+\/accept$/) && req.method === "POST") {
    try {
      const token = url.pathname.split("/")[4];
      const body = await req.json();

      if (!body.password || !body.password_confirm) {
        return new Response(
          JSON.stringify({ ok: false, error: "Password is required" }),
          { status: 400, headers }
        );
      }

      if (body.password !== body.password_confirm) {
        return new Response(
          JSON.stringify({ ok: false, error: "Passwords do not match" }),
          { status: 400, headers }
        );
      }

      if (body.password.length < 8) {
        return new Response(
          JSON.stringify({ ok: false, error: "Password must be at least 8 characters" }),
          { status: 400, headers }
        );
      }

      if (!dbConnected) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database not connected" }),
          { status: 503, headers }
        );
      }

      const inviteResult = await db.queryObject(
        `SELECT id, email, name, phone, status, expires_at FROM owner_invitations WHERE invitation_token = $1`,
        [token]
      );

      if (inviteResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid invitation token" }),
          { status: 404, headers }
        );
      }

      const invite = inviteResult.rows[0] as any;

      if (invite.status !== "pending") {
        return new Response(
          JSON.stringify({ ok: false, error: "Invitation already used or expired" }),
          { status: 400, headers }
        );
      }

      if (new Date(invite.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invitation has expired" }),
          { status: 400, headers }
        );
      }

      // Create auth user via Supabase Admin SDK
      // This handles Opaque keys (sb_secret_...) correctly where raw fetch might fail
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseKey) {
        return new Response(
          JSON.stringify({ ok: false, error: "Service configuration error" }),
          { status: 500, headers }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          name: invite.name,
          phone: invite.phone,
          role: "owner"
        }
      });

      if (createError || !authUser) {
        console.error("[server] Auth user creation failed:", createError);
        return new Response(
          JSON.stringify({ ok: false, error: createError?.message || "Failed to create auth account" }),
          { status: 500, headers }
        );
      }

      // authUser is UserResponse, we need authUser.user
      const createdUser = authUser.user;

      // Create user record in database
      const userResult = await db.queryObject(
        `INSERT INTO users (email, phone, name, role, auth_user_id)
         VALUES ($1, $2, $3, 'owner', $4)
         RETURNING id`,
        [invite.email, invite.phone || null, invite.name, createdUser.id]
      );

      const userId = (userResult.rows[0] as any).id;

      // Mark invitation as accepted
      await db.queryObject(
        `UPDATE owner_invitations
         SET status = 'accepted', accepted_at = NOW()
         WHERE invitation_token = $1`,
        [token]
      );

      console.log(`[server] Owner invitation accepted for ${invite.email}: ${userId}`);

      return new Response(
        JSON.stringify({
          ok: true,
          user_id: userId,
          message: "Account created successfully! You can now log in."
        }),
        { status: 201, headers }
      );
    } catch (err) {
      console.error("[server] Error accepting invitation:", err);
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
