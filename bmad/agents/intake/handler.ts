// Intake Agent handler (Deno)
// Minimal stub — implement Supabase/Twilio parsing and enqueue logic here.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  try {
    const body = await req.text();
    // TODO: verify Twilio signature, parse incoming form or JSON
    console.log("[intake-agent] received payload", body.slice(0, 200));

    // TODO: validate payload and write to Supabase
    // TODO: push an event to events_outbox (via Supabase insert)

    return new Response(JSON.stringify({ status: "received" }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response("internal error", { status: 500 });
  }
}

if (import.meta.main) {
  serve(handler);
}
