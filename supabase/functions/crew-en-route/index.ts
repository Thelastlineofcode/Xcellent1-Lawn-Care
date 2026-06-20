import { sendSMS, logNotification, shouldSendNotification } from "../_shared/notifications.ts";

// Event: Crew en route — Customer SMS with ETA
// Triggered when crew marks "en route" in app

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { job_id, customer_phone, address, eta_minutes } = await req.json();

  if (!(await shouldSendNotification("customer", "sms", "crew_en_route", job_id))) {
    return new Response(JSON.stringify({ ok: true, skipped: "Duplicate crew_en_route" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const smsOk = await sendSMS(customer_phone, `🚗 Your crew is en route! ETA: ~${eta_minutes || 15} minutes. Address: ${address}`);
  await logNotification("customer", undefined, "sms", "crew_en_route", job_id, { job_id, eta_minutes }, smsOk ? "sent" : "failed");
  
  return new Response(JSON.stringify({ ok: smsOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
