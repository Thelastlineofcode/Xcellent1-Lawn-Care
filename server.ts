// Deno HTTP server with Supabase PostgreSQL integration
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Database connection
const DATABASE_URL =
  Deno.env.get("DATABASE_URL") ||
  "postgresql://postgres:shine6911@db.utivthfrwgtjatsusopw.supabase.co:5432/postgres";
const db = new Client(DATABASE_URL);

let dbConnected = false;

// Connect to database
async function connectDB() {
  try {
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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // POST /api/v1/quotes/estimate (owner dashboard quote calculator)
  if (url.pathname === "/api/v1/quotes/estimate" && req.method === "POST") {
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

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Serve static files
  if (url.pathname.startsWith("/static/")) {
    const response = await serveDir(req, { fsRoot: "./web", urlRoot: "" });
    // Add cache control headers - don't cache HTML files
    if (url.pathname.endsWith('.html')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    return response;
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
        "Pragma": "no-cache",
        "Expires": "0"
      },
    });
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
    try {
      const crewId = url.pathname.split("/")[3];

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

  // GET /api/client/:id/dashboard (client portal data)
  if (
    url.pathname.match(/^\/api\/client\/[^\/]+\/dashboard$/) &&
    req.method === "GET"
  ) {
    try {
      const clientId = url.pathname.split("/")[3];

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
          JSON.stringify({ ok: false, error: "Valid phone number is required" }),
          { status: 400, headers }
        );
      }
      if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Valid email is required" }),
          { status: 400, headers }
        );
      }
      if (!body.position || !["field-worker", "crew-lead"].includes(body.position)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Please select a valid position" }),
          { status: 400, headers }
        );
      }

      const positionName = body.position === "field-worker" ? "Field Worker" : "Crew Lead";
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
        console.error("[server] Error writing careers application to dev_db:", fileErr);
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
          JSON.stringify({ ok: false, error: "Valid phone number is required" }),
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
        console.error("[server] Error writing service inquiry to dev_db:", fileErr);
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
