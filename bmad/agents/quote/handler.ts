// Quote Agent handler (Deno)
// Returns price ranges and two suggested slots. Simple heuristic stub.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

function estimatePrice({
  service_type,
  lawn_size_sqft,
  frequency,
}: Record<string, any>) {
  const base =
    { mowing: 3000, edging: 500, aeration: 8000 }[service_type] ?? 2500;
  const sizeFactor = Math.max(
    0.5,
    Math.min(3, (lawn_size_sqft || 2000) / 2000)
  );
  const low = Math.round(base * sizeFactor);
  const high = Math.round(low * 1.25);
  return { price_low_cents: low, price_high_cents: high };
}

export async function handler(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const estimate = estimatePrice(data);
    const now = new Date();
    const slot1 = new Date(
      now.getTime() + 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    const slot2 = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    return new Response(
      JSON.stringify({
        ...estimate,
        notes: "heuristic",
        valid_until: new Date(
          now.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
        slots: [slot1, slot2],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "bad request" }), {
      status: 400,
    });
  }
}

if (import.meta.main) serve(handler);
