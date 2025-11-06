// Invoice Agent handler (Deno) - creates invoice record and returns a paylink (mock in dev)
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[invoice-agent] payload", payload);
    const lib = await import("../lib/supabase.ts");
    const invoice = {
      job_id: payload.job_id,
      amount_cents: payload.amount_cents || 0,
      description: payload.description || "service",
      issued_at: new Date().toISOString(),
      status: "issued",
    };
    const saved = await lib
      .supabaseInsert("invoices", invoice)
      .catch(async (e) => {
        console.error(e);
        const stub = await import("../supabase_client_stub.ts");
        return stub.createInvoice(invoice);
      });

    // Create Stripe Checkout session/paylink - stubbed for dev
    const paylink =
      Deno.env.get("STRIPE_CHECKOUT_URL") ||
      `https://stripe.checkout/mock/${saved.id}`;
    return new Response(
      JSON.stringify({ invoice_id: saved.id, url: paylink }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
}

if (import.meta.main) serve(handler);
