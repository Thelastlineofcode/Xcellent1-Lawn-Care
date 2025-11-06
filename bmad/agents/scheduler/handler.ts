// Scheduler Agent handler (Deno) - stub
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  const now = new Date().toISOString();
  console.log("[scheduler-agent] called at", now);
  // TODO: read accepted quote, check crew availability, create job, write to outbox
  return new Response(JSON.stringify({ status: "scheduled", job_id: `job_${Date.now()}` }), { status: 200 });
}

if (import.meta.main) serve(handler);
