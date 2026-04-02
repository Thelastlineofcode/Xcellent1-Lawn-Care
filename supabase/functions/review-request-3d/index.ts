import { sendSMS, logNotification, shouldSendNotification } from "../_shared/notifications.ts";

// Event: 3 days post-completion — Customer review request
// Triggered by cron (daily)

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { jobs } = await req.json();
  
  if (!Array.isArray(jobs)) {
    return new Response(JSON.stringify({ ok: false, error: "Expected jobs array" }), { status: 400 });
  }
  
  const results: { job_id: string; sms_sent: boolean }[] = [];
  
  for (const job of jobs) {
    let smsOk = false;
    if (await shouldSendNotification("customer", "sms", "review_request_3d", job.id)) {
      smsOk = await sendSMS(
        job.customer_phone,
        `Hi ${job.customer_name}! How was your lawn service? We'd love your feedback: https://g.page/r/CZbYqiFFQ57SEBM/review Thank you! — Xcellent1 Lawn Care`,
      );
      await logNotification(
        "customer",
        undefined,
        "sms",
        "review_request_3d",
        job.id,
        { job_id: job.id },
        smsOk ? "sent" : "failed",
      );
    }
    results.push({ job_id: job.id, sms_sent: smsOk });
  }
  
  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
