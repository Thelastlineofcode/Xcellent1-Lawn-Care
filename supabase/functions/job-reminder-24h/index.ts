import { sendSMS, logNotification, shouldSendNotification } from "../_shared/notifications.ts";

// Event: 24hrs before job — Crew reminder + Customer reminder
// Triggered by cron (daily at 6pm CT)

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { jobs } = await req.json();
  
  if (!Array.isArray(jobs)) {
    return new Response(JSON.stringify({ ok: false, error: "Expected jobs array" }), { status: 400 });
  }
  
  const results: { job_id: string; crew_sms: boolean; customer_sms: boolean }[] = [];
  
  for (const job of jobs) {
    let crewSmsOk = false;
    if (await shouldSendNotification("crew", "sms", "job_reminder_24h", job.id)) {
      crewSmsOk = await sendSMS(
        job.crew_phone,
        `⏰ Reminder: Job tomorrow at ${job.scheduled_time} - ${job.address}`,
      );
      await logNotification(
        "crew",
        undefined,
        "sms",
        "job_reminder_24h",
        job.id,
        { job_id: job.id },
        crewSmsOk ? "sent" : "failed",
      );
    }
    
    let custSmsOk = false;
    if (await shouldSendNotification("customer", "sms", "job_reminder_24h", job.id)) {
      custSmsOk = await sendSMS(
        job.customer_phone,
        `⏰ Reminder: Your lawn service is tomorrow at ${job.scheduled_time}. Address: ${job.address}`,
      );
      await logNotification(
        "customer",
        undefined,
        "sms",
        "job_reminder_24h",
        job.id,
        { job_id: job.id },
        custSmsOk ? "sent" : "failed",
      );
    }
    
    results.push({ job_id: job.id, crew_sms: crewSmsOk, customer_sms: custSmsOk });
  }
  
  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
