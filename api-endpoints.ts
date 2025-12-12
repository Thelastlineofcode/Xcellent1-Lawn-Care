// ============================================
// QUOTES & PRICING ESTIMATE ENDPOINT
// ============================================

// POST /api/quotes/estimate - Get a price estimate for a service
async function handleEstimate(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }
  // Required fields: service_type, lawn_size, frequency
  const { service_type, lawn_size, frequency } = body;
  if (!service_type || !lawn_size || !frequency) {
    return error(
      "Missing required fields: service_type, lawn_size, frequency",
      400,
    );
  }
  // Simple pricing logic (can be replaced with more advanced logic)
  // Example: $45 base, adjust by size/frequency
  let base = 45;
  if (lawn_size === "large") base += 20;
  if (lawn_size === "small") base -= 10;
  if (frequency === "weekly") base *= 0.9;
  if (frequency === "biweekly") base *= 1.0;
  if (frequency === "monthly") base *= 1.2;
  // Add service_type modifier
  if (service_type === "premium") base += 15;
  if (service_type === "basic") base += 0;
  // Return a range
  const price_low_cents = Math.round(base * 100);
  const price_high_cents = Math.round((base + 10) * 100);
  const valid_until = new Date(Date.now() + 1000 * 60 * 60).toISOString();
  return json({
    price_low_cents,
    price_high_cents,
    notes: "Estimate based on average yard charge and selected options.",
    valid_until,
  });
}
// ============================================
// LEAD INTAKE ENDPOINT
// ============================================

// POST /api/leads - Intake a new lead
async function handleLeads(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body", 400);
  }
  if (!body.name || body.name.trim().length < 2) {
    return error("Name must be at least 2 characters", 400);
  }
  if (!body.phone || !isValidPhone(body.phone)) {
    return error("Valid phone is required", 400);
  }
  if (!body.email || !isValidEmail(body.email)) {
    return error("Valid email is required", 400);
  }
  // Optionally: add more fields/validation as needed
  const { name, phone, email, notes = "", source = "web" } = body;
  // Save to Supabase
  const { data, error: dbError } = await supabase
    .from("leads")
    .insert([{ name, phone, email, notes, source }])
    .select();
  if (dbError) {
    return error("Failed to save lead: " + dbError.message, 500);
  }
  return json({ success: true, lead: data?.[0] });
}
// Xcellent1 Lawn Care - API Endpoints
// Deno backend for Supabase + Stripe integration

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONFIG & SETUP
// ============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "";
const EMAIL_API_KEY = Deno.env.get("EMAIL_API_KEY") || ""; // Resend or SendGrid
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ||
  "noreply@xcellent1lawncare.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// UTILITY FUNCTIONS
// ============================================

// JSON response helper
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Error response
function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// Validate email
function isValidEmail(email: string): boolean {
  const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return re.test(email);
}

// Validate phone (basic)
function isValidPhone(phone: string): boolean {
  const re = /^[\\d\\s()+-]+$/;
  return re.test(phone) && phone.replace(/\\D/g, "").length >= 10;
}

// Rate limiting (simple in-memory)
const rateLimitStore: Record<string, number[]> = {};
function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = [];
  }

  // Remove old requests outside window
  rateLimitStore[ip] = rateLimitStore[ip].filter((t) => now - t < windowMs);

  if (rateLimitStore[ip].length >= limit) {
    return false;
  }

  rateLimitStore[ip].push(now);
  return true;
}

// Send email (using Resend)
async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    return response.ok;
  } catch {
    console.error("Email send failed:", to, subject);
    return false;
  }
}

// ============================================
// CORS MIDDLEWARE
// ============================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// ============================================
// ENDPOINTS (ARCHIVE NOTE)
// ============================================
// NOTE: `api-endpoints.ts` contains experimental/legacy endpoints. The canonical runtime handlers live in `server.ts`.
// To avoid duplication and divergence, prefer `server.ts` for runtime behavior and refactor this file to import shared handlers.
// ----

// POST /api/waitlist - Customer joins waitlist
async function handleWaitlist(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip, 5, 60000)) {
      return error("Too many requests", 429);
    }

    const body = await req.json();
    const { name, email, phone, address, city, state, zip, service_date } =
      body;

    // Validation
    if (!name || !email || !phone || !address) {
      return error("Missing required fields");
    }

    if (!isValidEmail(email)) {
      return error("Invalid email format");
    }

    if (!isValidPhone(phone)) {
      return error("Invalid phone format");
    }

    // Insert into waitlist
    const { data, error: dbError } = await supabase
      .from("waitlist")
      .insert({
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        service_date,
        status: "pending",
      })
      .select();

    if (dbError) {
      console.error("Waitlist insert error:", dbError);
      return error("Failed to add to waitlist", 500);
    }

    // Send confirmation email
    const confirmationHtml = `
      <h2>Welcome to Xcellent1 Lawn Care!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining our waitlist! We're excited to help you with your lawn care needs.</p>
      <p>We'll be in touch soon as we expand our service area.</p>
      <p>Best regards,<br>Xcellent1 Lawn Care Team</p>
    `;

    await sendEmail(email, "Welcome to Xcellent1 Waitlist", confirmationHtml);

    // Notify owner
    const ownerEmail = Deno.env.get("OWNER_EMAIL") ||
      "owner@xcellent1lawncare.com";
    const ownerHtml = `
      <h2>New Waitlist Signup</h2>
      <p><strong>${name}</strong></p>
      <p>Email: ${email}</p>
      <p>Phone: ${phone}</p>
      <p>Address: ${address}, ${city}, ${state} ${zip}</p>
      <p>Service Date: ${service_date || "Not specified"}</p>
    `;

    await sendEmail(ownerEmail, "New Waitlist Signup", ownerHtml);

    return json(
      {
        success: true,
        id: data?.[0]?.id,
        message: "You're on the waitlist!",
      },
      201,
    );
  } catch (err) {
    console.error("Waitlist error:", err);
    return error("Internal server error", 500);
  }
}

// POST /api/applications - Crew member applies
async function handleApplications(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip, 3, 60000)) {
      return error("Too many applications", 429);
    }

    const body = await req.json();
    const { name, email, phone, experience, availability, message } = body;

    // Validation
    if (!name || !email || !phone) {
      return error("Missing required fields");
    }

    if (!isValidEmail(email)) {
      return error("Invalid email format");
    }

    // Insert application
    const { data, error: dbError } = await supabase
      .from("applications")
      .insert({
        name,
        email,
        phone,
        experience,
        availability,
        message,
        status: "new",
      })
      .select();

    if (dbError) {
      console.error("Application insert error:", dbError);
      return error("Failed to submit application", 500);
    }

    // Send confirmation email to applicant
    const confirmHtml = `
      <h2>Thank you for applying!</h2>
      <p>Hi ${name},</p>
      <p>We received your application to join our crew. We'll review it and be in touch soon.</p>
      <p>Best regards,<br>Xcellent1 Lawn Care Team</p>
    `;

    await sendEmail(email, "Application Received", confirmHtml);

    // Notify owner
    const ownerEmail = Deno.env.get("OWNER_EMAIL") ||
      "owner@xcellent1lawncare.com";
    const ownerHtml = `
      <h2>New Job Application</h2>
      <p><strong>${name}</strong></p>
      <p>Email: ${email}</p>
      <p>Phone: ${phone}</p>
      <p>Experience: ${experience || "Not provided"}</p>
      <p>Availability: ${availability || "Not provided"}</p>
      <p>Message: ${message || "None"}</p>
    `;

    await sendEmail(ownerEmail, "New Job Application", ownerHtml);

    return json(
      {
        success: true,
        id: data?.[0]?.id,
        message: "Application submitted successfully!",
      },
      201,
    );
  } catch (err) {
    console.error("Application error:", err);
    return error("Internal server error", 500);
  }
}

// POST /api/auth/login - Crew/Owner OTP login
async function handleAuthLogin(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return error("Email or phone required");
    }

    // Send OTP via email or SMS (implementation depends on service)
    // For now, generate a simple OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store OTP in cache or database (temporary solution)
    // In production, use Redis or Supabase functions
    console.log("OTP for", email || phone, ":", otp);

    // Send OTP email
    if (email) {
      const html = `
        <h2>Your Login Code</h2>
        <p>Enter this code to log in: <strong>${otp}</strong></p>
        <p>This code expires in 15 minutes.</p>
      `;
      await sendEmail(email, "Your Xcellent1 Login Code", html);
    }

    return json({
      success: true,
      message: "OTP sent",
      // In production, don't return OTP. This is for testing only.
      otp: Deno.env.get("DENO_ENV") === "development" ? otp : undefined,
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return error("Internal server error", 500);
  }
}

// GET /api/jobs - Get jobs for crew member (requires auth)
async function handleGetJobs(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return error("Method not allowed", 405);
  }

  try {
    // In production, verify JWT from auth header
    // For now, query all jobs (implement auth later)

    const { data, error: dbError } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "scheduled")
      .order("job_date", { ascending: true });

    if (dbError) {
      return error("Failed to fetch jobs", 500);
    }

    return json({ success: true, jobs: data || [] });
  } catch (err) {
    console.error("Get jobs error:", err);
    return error("Internal server error", 500);
  }
}

// POST /api/jobs/:id/complete - Mark job as complete
async function handleCompleteJob(
  req: Request,
  jobId: string,
): Promise<Response> {
  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const body = await req.json();
    const { actual_hours, notes } = body;

    if (!actual_hours) {
      return error("Hours worked required");
    }

    // Update job
    const { data, error: dbError } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        actual_hours,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select();

    if (dbError) {
      return error("Failed to complete job", 500);
    }

    // Auto-generate invoice (trigger in database or here)
    if (data && data[0]) {
      const job = data[0];
      const invoiceNumber = `INV-${Date.now()}`;
      const amount = job.amount || job.actual_hours * 50; // $50/hour default

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          job_id: jobId,
          customer_id: job.customer_id,
          invoice_number: invoiceNumber,
          amount,
          status: "draft",
          due_date:
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split(
              "T",
            )[0],
        });

      if (!invoiceError) {
        console.log("Invoice created:", invoiceNumber);
      }
    }

    // Notify owner
    const ownerEmail = Deno.env.get("OWNER_EMAIL") ||
      "owner@xcellent1lawncare.com";
    const html = `
      <h2>Job Completed</h2>
      <p>Job #${jobId} has been marked complete.</p>
      <p>Hours: ${actual_hours}</p>
      <p>Check dashboard for details.</p>
    `;
    await sendEmail(ownerEmail, "Job Completed", html);

    return json({ success: true, message: "Job completed" });
  } catch (err) {
    console.error("Complete job error:", err);
    return error("Internal server error", 500);
  }
}

// POST /api/webhooks/stripe - Stripe webhook handler
async function handleStripeWebhook(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return error("Method not allowed", 405);
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Verify signature (implement Stripe signature verification)
    // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

    // For now, parse the body
    const event = JSON.parse(body);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      // Update invoice status
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: "completed", paid_at: new Date().toISOString() })
        .eq("stripe_payment_id", paymentIntent.id);

      if (!updateError) {
        console.log("Payment marked complete:", paymentIntent.id);
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return error("Internal server error", 500);
  }
}

// ============================================
// ROUTER
// ============================================

async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  // Add CORS headers
  const response = await routeRequest(pathname, req);
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

async function routeRequest(pathname: string, req: Request): Promise<Response> {
  // POST /api/waitlist
  if (pathname === "/api/waitlist") {
    return await handleWaitlist(req);
  }

  // POST /api/leads
  if (pathname === "/api/leads") {
    return await handleLeads(req);
  }

  // POST /api/quotes/estimate
  if (pathname === "/api/quotes/estimate") {
    return await handleEstimate(req);
  }

  // POST /api/applications
  if (pathname === "/api/applications") {
    return await handleApplications(req);
  }

  // POST /api/auth/login
  if (pathname === "/api/auth/login") {
    return await handleAuthLogin(req);
  }

  // GET /api/jobs
  if (pathname === "/api/jobs") {
    return await handleGetJobs(req);
  }

  // POST /api/jobs/:id/complete
  const jobCompleteMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/complete$/);
  if (jobCompleteMatch) {
    return await handleCompleteJob(req, jobCompleteMatch[1]);
  }

  // POST /api/webhooks/stripe
  if (pathname === "/api/webhooks/stripe") {
    return await handleStripeWebhook(req);
  }

  // Health check
  if (pathname === "/health") {
    return json({ status: "ok" });
  }

  // 404
  return error("Not found", 404);
}

// ============================================
// START SERVER
// ============================================

const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server listening on port ${port}`);
serve(handler, { port });
