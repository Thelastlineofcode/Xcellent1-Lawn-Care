import {
  sendSMS,
  sendEmail,
  logNotification,
  NotificationEvent,
  shouldSendNotification,
} from "../_shared/notifications.ts";

// Event: Job scheduled
// Triggers: Crew SMS, Customer SMS + Email (confirmation)

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const event: NotificationEvent = await req.json();
  const { job_id, payload } = event;
  
  const crewPhone = (payload.crew_phone as string) || "";
  const customerPhone = (payload.customer_phone as string) || "";
  const customerEmail = (payload.customer_email as string) || "";
  const jobDate = (payload.scheduled_date as string) || "";
  const jobAddress = (payload.address as string) || "";
  const jobTime = (payload.scheduled_time as string) || "8:00 AM";
  
  const errors: string[] = [];
  
  // Crew SMS (deduped by job_id)
  if (crewPhone && await shouldSendNotification("crew", "sms", "job_scheduled", job_id)) {
    const crewSmsOk = await sendSMS(
      crewPhone,
      `📋 New job scheduled: ${jobDate} at ${jobTime} - ${jobAddress}`,
    );
    if (!crewSmsOk) errors.push("Crew SMS failed");
    await logNotification(
      "crew",
      undefined,
      "sms",
      "job_scheduled",
      job_id,
      { job_id },
      crewSmsOk ? "sent" : "failed",
    );
  }
  
  // Customer SMS (deduped by job_id)
  if (customerPhone && await shouldSendNotification("customer", "sms", "job_scheduled", job_id)) {
    const custSmsOk = await sendSMS(
      customerPhone,
      `📋 Your lawn service is confirmed for ${jobDate} at ${jobTime}. Address: ${jobAddress}`,
    );
    if (!custSmsOk) errors.push("Customer SMS failed");
    await logNotification(
      "customer",
      undefined,
      "sms",
      "job_scheduled",
      job_id,
      { job_id },
      custSmsOk ? "sent" : "failed",
    );
  }
  
  // Customer Email (deduped by job_id)
  if (customerEmail && await shouldSendNotification("customer", "email", "job_scheduled", job_id)) {
    const html =
      `<h2>Service Confirmation</h2><p>Your lawn service is confirmed:</p><ul><li>Date: ${jobDate}</li><li>Time: ${jobTime}</li><li>Address: ${jobAddress}</li></ul><p>Questions? Call us at (504) 875-8079</p>`;
    const emailOk = await sendEmail(
      customerEmail,
      "Service Confirmed - Xcellent1 Lawn Care",
      html,
    );
    if (!emailOk) errors.push("Customer email failed");
    await logNotification(
      "customer",
      undefined,
      "email",
      "job_scheduled",
      job_id,
      { job_id },
      emailOk ? "sent" : "failed",
    );
  }
  
  return new Response(JSON.stringify({ ok: errors.length === 0, errors }), {
    status: errors.length === 0 ? 200 : 207,
    headers: { "Content-Type": "application/json" },
  });
});
