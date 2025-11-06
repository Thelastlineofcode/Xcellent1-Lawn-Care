import { handler } from "../quote/handler.ts";

Deno.test("quote heuristic - mowing 1000 sqft", async () => {
  const body = { service_type: "mowing", lawn_size_sqft: 1000 };
  const req = new Request("http://localhost/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const res = await handler(req);
  if (res.status !== 200) {
    const txt = await res.text();
    throw new Error(`unexpected status ${res.status}: ${txt}`);
  }
  const json = await res.json();
  // For mowing base=3000 cents, sizeFactor = max(0.5, min(3,1000/2000)) = 0.5
  // low = 3000 * 0.5 = 1500, high = round(1500 * 1.25) = 1875
  if (json.price_low_cents !== 1500) {
    throw new Error(`expected low 1500 got ${json.price_low_cents}`);
  }
  if (json.price_high_cents !== 1875) {
    throw new Error(`expected high 1875 got ${json.price_high_cents}`);
  }
});
