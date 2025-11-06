// Digest Agent (Deno) - stub
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler() {
  console.log("[digest-agent] aggregating KPIs (stub)");
  // TODO: query Supabase for KPIs and write outbox events for email + sms
  return new Response(JSON.stringify({ status: "digest_created" }), { status: 200 });
}

if (import.meta.main) serve(() => handler());
