// Intake Agent handler (Deno)
// Minimal stub — implement Supabase/Twilio parsing and enqueue logic here.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  try {
    const body = await req.text();
    // TODO: verify Twilio signature, parse incoming form or JSON
    console.log("[intake-agent] received payload", body.slice(0, 200));

    // use lightweight supabase helper (falls back to stub if env not set)
    const lib = await import("../lib/supabase.ts");
    const lead = { raw: body, received_at: new Date().toISOString() };
    const saved = await lib
      .supabaseInsert("leads", lead)
      .catch(async (e) => {
        console.error(e);
        const stub = await import("../supabase_client_stub.ts");
        return stub.insertLead(lead);
      });
    await lib
      .supabaseInsert("events_outbox", { type: "LEAD_CREATED", ref_id: saved.id, payload: lead })
      .catch(async (e) => {
        console.error(e);
        const stub = await import("../supabase_client_stub.ts");
        return stub.insertOutboxEvent({ type: "LEAD_CREATED", ref_id: saved.id, payload: lead });
      });

    return new Response(JSON.stringify({ status: "received", lead_id: saved.id }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("internal error", { status: 500 });
  }
}

if (import.meta.main) {
  serve(handler);
}
