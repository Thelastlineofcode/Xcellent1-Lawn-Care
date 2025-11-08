// Deno HTTP server with Supabase PostgreSQL integration
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Database connection
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgresql://postgres:shine6911@db.utivthfrwgtjatsusopw.supabase.co:5432/postgres";
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
  
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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
  
  // Redirect root to careers page
  if (url.pathname === "/") {
    return new Response(null, {
      status: 302,
      headers: { "Location": "/static/index.html" }
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
      
      const source = body.source || "web";
      const isApplication = source === "careers";
      
      if (dbConnected) {
        // Save to database
        const result = await db.queryObject(`
          INSERT INTO applications (name, phone, email, notes, source, status)
          VALUES ($1, $2, $3, $4, $5, 'pending')
          RETURNING id
        `, [body.name.trim(), body.phone.trim(), body.email.trim(), body.notes?.trim() || "", source]);
        
        const id = (result.rows[0] as any).id;
        
        // Add to outbox
        await db.queryObject(`
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ($1, $2, $3, 'pending')
        `, ["LEAD_CREATED", id, JSON.stringify(body)]);
        
        console.log(`[server] ${isApplication ? 'Application' : 'Lead'} created: ${id}`);
        return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
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
          created_at: new Date().toISOString()
        };
        leads.set(id, lead);
        
        const eventId = `event-${eventCounter++}`;
        outbox.set(eventId, {
          id: eventId,
          type: "LEAD_CREATED",
          ref_id: id,
          payload: lead,
          created_at: new Date().toISOString()
        });
        
        console.log(`[server] ${isApplication ? 'Application' : 'Lead'} created (in-memory): ${id}`);
        return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
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
          pending: eventsResult.rows
        };
        return new Response(JSON.stringify(data), { status: 200, headers });
      } else {
        // Fallback to in-memory
        const data = {
          ok: true,
          leads: Array.from(leads.values()),
          pending: Array.from(outbox.values())
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
  if (url.pathname.match(/^\/api\/crew\/[^\/]+\/jobs$/) && req.method === "GET") {
    try {
      const crewId = url.pathname.split("/")[3];
      
      if (dbConnected) {
        const result = await db.queryObject(`
          SELECT * FROM get_crew_jobs($1, CURRENT_DATE)
        `, [crewId]);
        
        return new Response(JSON.stringify({ ok: true, jobs: result.rows }), { status: 200, headers });
      } else {
        // Mock data for demo
        const mockJobs = [
          {
            id: 'job-001',
            client_name: 'Sarah Martinez',
            property_address: '123 Oak Street, Austin TX',
            scheduled_time: '08:00',
            services: ['Mowing', 'Edging', 'Trimming'],
            notes: 'Gate code: 1234',
            status: 'assigned'
          }
        ];
        return new Response(JSON.stringify({ ok: true, jobs: mockJobs }), { status: 200, headers });
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
        const result = await db.queryObject(`SELECT get_owner_metrics() as metrics`);
        const metrics = (result.rows[0] as any).metrics;
        
        return new Response(JSON.stringify({ ok: true, ...metrics }), { status: 200, headers });
      } else {
        // Mock metrics
        const mockMetrics = {
          ok: true,
          active_crew: 6,
          new_applications: 12,
          jobs_this_week: 42,
          photos_today: 18,
          total_clients: 24
        };
        return new Response(JSON.stringify(mockMetrics), { status: 200, headers });
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
  if (url.pathname.match(/^\/api\/client\/[^\/]+\/dashboard$/) && req.method === "GET") {
    try {
      const clientId = url.pathname.split("/")[3];
      
      if (dbConnected) {
        const result = await db.queryObject(`
          SELECT get_client_dashboard($1) as data
        `, [clientId]);
        
        const data = (result.rows[0] as any).data;
        return new Response(JSON.stringify({ ok: true, ...data }), { status: 200, headers });
      } else {
        // Mock client data
        const mockData = {
          ok: true,
          client: { name: 'Sarah Martinez', address: '123 Oak Street, Austin TX' },
          balance_due: 125.00,
          recent_jobs: [
            { id: 'job-001', scheduled_date: '2025-11-05', services: ['Mowing', 'Edging'], status: 'completed' }
          ],
          photos: [
            { id: 1, photo_type: 'before', photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', job_date: '2025-11-05' },
            { id: 2, photo_type: 'after', photo_url: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400', job_date: '2025-11-05' }
          ]
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
        await db.queryObject(`
          INSERT INTO job_photos (job_id, photo_type, photo_url, photo_storage_path)
          VALUES ($1, $2, $3, $4)
        `, [jobId, body.type || 'after', path, filename]);
        
        // Add event
        await db.queryObject(`
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ('PHOTO_UPLOADED', $1, $2, 'pending')
        `, [jobId, JSON.stringify({ photo_path: path, job_id: jobId, type: body.type })]);
      } else {
        // Fallback to outbox
        const eventId = `event-${eventCounter++}`;
        outbox.set(eventId, {
          id: eventId,
          type: "PHOTO_UPLOADED",
          ref_id: jobId,
          payload: { photo_path: path, job_id: jobId },
          created_at: new Date().toISOString()
        });
      }
      
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
  
  // PATCH /api/jobs/:id/complete (mark job done)
  const completeMatch = url.pathname.match(/^\/api\/jobs\/([^\/]+)\/complete$/);
  if (completeMatch && req.method === "PATCH") {
    try {
      const jobId = completeMatch[1];
      
      if (dbConnected) {
        await db.queryObject(`
          UPDATE jobs
          SET status = 'completed', completed_at = NOW()
          WHERE id = $1
        `, [jobId]);
        
        console.log(`[server] Job completed: ${jobId}`);
        return new Response(JSON.stringify({ ok: true, id: jobId }), { status: 200, headers });
      } else {
        // Mock success for demo
        return new Response(JSON.stringify({ ok: true, id: jobId }), { status: 200, headers });
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
        const result = await db.queryObject(`
          INSERT INTO outbox_events (event_type, ref_id, payload, status)
          VALUES ($1, $2, $3, 'pending')
          RETURNING id
        `, [body.type, body.ref_id || "", JSON.stringify(body.payload || {})]);
        
        const id = (result.rows[0] as any).id;
        console.log(`[server] Outbox event created: ${id} (${body.type})`);
        return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
      } else {
        const id = `event-${eventCounter++}`;
        const event = {
          id,
          type: body.type,
          ref_id: body.ref_id || "",
          payload: body.payload || {},
          created_at: new Date().toISOString()
        };
        outbox.set(id, event);
        console.log(`[server] Outbox event created (in-memory): ${id} (${body.type})`);
        return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers });
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
  return new Response(
    JSON.stringify({ ok: false, error: "Not found" }),
    { status: 404, headers }
  );
}

const PORT = parseInt(Deno.env.get("PORT") || "8000");

// Connect to database before starting server
await connectDB();

console.log(`🚀 Server running on http://localhost:${PORT}`);
console.log(`🏠 Careers Page: http://localhost:${PORT}/`);
console.log(`🗺️ Portal Nav: http://localhost:${PORT}/static/portal-index.html`);
console.log(`👷 Crew Dashboard: http://localhost:${PORT}/static/crew.html`);
console.log(`📊 Owner Dashboard: http://localhost:${PORT}/static/owner.html`);
console.log(`👤 Client Portal: http://localhost:${PORT}/static/client.html`);
console.log(`💼 Hiring Dashboard: http://localhost:${PORT}/static/dashboard.html`);

serve(handler, { port: PORT });
