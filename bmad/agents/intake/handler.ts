// Intake Agent handler (Deno)
// Minimal stub — implement Supabase/Twilio parsing and enqueue logic here.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  try {
    const body = await req.text();
    // TODO: verify Twilio signature, parse incoming form or JSON
    console.log("[intake-agent] received payload", body.slice(0, 200));

    // simple local flow using stub helper (avoids external deps in initial scaffolding)
    const { insertLead, insertOutboxEvent } = await import(
      "../supabase_client_stub.ts"
    );
    const lead = { raw: body, received_at: new Date().toISOString() };
    const saved = await insertLead(lead);
    await insertOutboxEvent({
      type: "LEAD_CREATED",
      ref_id: saved.id,
      payload: lead,
    });

    return new Response(
      JSON.stringify({ status: "received", lead_id: saved.id }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response("internal error", { status: 500 });
  }
}

if (import.meta.main) {
  serve(handler);
}
