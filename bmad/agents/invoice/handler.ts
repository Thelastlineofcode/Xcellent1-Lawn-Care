// Invoice Agent handler (Deno) - stub
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

export async function handler(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[invoice-agent] payload", payload);
    // TODO: create invoice in Supabase and call Stripe API to create checkout link
    return new Response(
      JSON.stringify({
        invoice_id: `inv_${Date.now()}`,
        url: "https://stripe.checkout/mock",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
}

if (import.meta.main) serve(handler);
