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
  // Move url and headers to top for all endpoint logic
  const url = new URL(req.url);
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Helper: Supabase JWT auth check (for protected endpoints)
  async function requireAuth(): Promise<any | null> {
    const authHeader = req.headers.get("authorization") || "";
    try {
      // Minimal decode (for demo/dev only)
      const base64Payload = authHeader.split(".")[1];
      if (!base64Payload) return null;
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch {
      return null;
    }
  }

  // POST /jobs (create job API)
  if (url.pathname === "/jobs" && req.method === "POST") {
    try {
      const body = await req.json();
      // Basic validation
      if (!body.customer_id || !body.job_date || !body.address) {
        return new Response(
          JSON.stringify({ ok: false, error: "Missing required fields: customer_id, job_date, address" }),
          { status: 400, headers }
        );
      }
      let jobId;
      if (dbConnected) {
        // Save to database
        const result = await db.queryObject(
          `INSERT INTO jobs (customer_id, crew_id, job_date, job_time, address, city, state, zip, job_type, description, status, estimated_hours, amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', $11, $12)
           RETURNING id`,
          [
            body.customer_id,
            body.crew_id || null,
            body.job_date,
            body.job_time || null,
            body.address,
            body.city || null,
            body.state || null,
            body.zip || null,
            body.job_type || null,
            body.description || null,
            body.estimated_hours || null,
            body.amount || null
          ]
        );
        jobId = (result.rows[0] as any).id;
        // Emit JOB_SCHEDULED event
        await db.queryObject(
          `INSERT INTO outbox_events (event_type, ref_id, payload, status)
           VALUES ($1, $2, $3, 'pending')`,
          ["JOB_SCHEDULED", jobId, JSON.stringify(body)]
        );
      } else {
        // Fallback to in-memory
        jobId = `job-${Date.now()}`;
        // ...existing code...
        // Optionally add to in-memory outbox
        const eventId = `event-${eventCounter++}`;
        outbox.set(eventId, {
          id: eventId,
          type: "JOB_SCHEDULED",
          ref_id: jobId,
          payload: body,
          created_at: new Date().toISOString(),
        });
      }
      return new Response(
        JSON.stringify({ ok: true, job_id: jobId, status: "scheduled" }),
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

  // Move url and headers to top for all endpoint logic
  const url = new URL(req.url);
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Helper: Supabase JWT auth check (for protected endpoints)
  async function requireAuth(): Promise<any | null> {
    const authHeader = req.headers.get("authorization") || "";
    try {
      // Minimal decode (for demo/dev only)
      const base64Payload = authHeader.split(".")[1];
      if (!base64Payload) return null;
      const payload = JSON.parse(atob(base64Payload));
      return payload;
    } catch {
      return null;
    }
  }

  // POST /quotes/estimate (stateless pricing helper)
  if (url.pathname === "/quotes/estimate" && req.method === "POST") {
    try {
      const body = await req.json();
      const { service_type, lawn_size, frequency } = body;
      if (!service_type || !lawn_size || !frequency) {
        return new Response(
          JSON.stringify({ ok: false, error: "Missing required fields: service_type, lawn_size, frequency" }),
          { status: 400, headers }
        );
      }
      // Simple pricing logic
      let base = 45;
      if (lawn_size === "large") base += 20;
      if (lawn_size === "small") base -= 10;
      if (frequency === "weekly") base *= 0.9;
      if (frequency === "biweekly") base *= 1.0;
      if (frequency === "monthly") base *= 1.2;
      if (service_type === "premium") base += 15;
      if (service_type === "basic") base += 0;
      const price_low_cents = Math.round(base * 100);
      const price_high_cents = Math.round((base + 10) * 100);
      const valid_until = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      return new Response(
        JSON.stringify({
          ok: true,
          price_low_cents,
          price_high_cents,
          notes: "Estimate based on average yard charge and selected options.",
          valid_until,
        }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error in /quotes/estimate:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "Internal server error" }),
        { status: 500, headers }
      );
    }
  }

  // POST /webhooks/twilio (Twilio SMS webhook receiver, stub)
  if (url.pathname === "/webhooks/twilio" && req.method === "POST") {
    try {
      // Parse Twilio payload (form-encoded or JSON)
      let body: any = {};
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        for (const [k, v] of form.entries()) body[k] = v;
      }

      // Signature verification placeholder
      // TODO: Implement Twilio signature verification
      const signatureValid = false; // Always false for now

      // Insert event into outbox (stub)
      const eventId = `event-${eventCounter++}`;
      outbox.set(eventId, {
        id: eventId,
        type: "TWILIO_INBOUND",
        ref_id: body.MessageSid || "unknown",
        payload: body,
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ ok: true, received: true, signatureValid }),
        { status: 200, headers }
      );
    } catch (err) {
      console.error("[server] Error in /webhooks/twilio:", err);
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

  // Health check endpoint
  if (url.pathname === "/health" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers,
    });
  }

  // Serve static files
  if (url.pathname.startsWith("/static/")) {
    return serveDir(req, { fsRoot: "./web", urlRoot: "" });
  }

  // Serve uploads
  if (url.pathname.startsWith("/uploads/")) {
    return serveDir(req, { fsRoot: "./web", urlRoot: "" });
  }

  // Redirect root to careers page
  if (url.pathname === "/") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/static/home.html" },
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

  // GET /api/owner/metrics (business KPIs, protected)
  if (url.pathname === "/api/owner/metrics" && req.method === "GET") {
    const user = await requireAuth();
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }
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
