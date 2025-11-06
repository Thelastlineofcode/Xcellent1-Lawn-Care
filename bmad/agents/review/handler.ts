// Review Invite Agent (Deno) - stub
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  const payload = await req.json().catch(() => ({}));
  console.log("[review-agent] invoice paid payload", payload);
  // TODO: enqueue review request in outbox (email + sms)
  return new Response(JSON.stringify({ status: "queued" }), { status: 200 });
}

if (import.meta.main) serve(handler);
