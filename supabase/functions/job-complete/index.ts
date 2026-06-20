import {
  sendSMS,
  sendEmail,
  logNotification,
  NotificationEvent,
  shouldSendNotification,
} from "../_shared/notifications.ts";

// Event: Job marked complete
// Triggers: Owner SMS + dashboard, Customer SMS + Email (completion + photo)

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const event: NotificationEvent = await req.json();
  const { job_id, payload } = event;
  
  const ownerPhone = Deno.env.get("OWNER_PHONE") || "";
  const customerPhone = (payload.customer_phone as string) || "";
  const customerEmail = (payload.customer_email as string) || "";
  const jobAddress = (payload.address as string) || "";
  const photoUrl = (payload.completion_photo_url as string) || "";
  
  const errors: string[] = [];
  
  // Owner SMS (deduped by job_id)
  if (await shouldSendNotification("owner", "sms", "job_complete", job_id)) {
    const ownerSmsOk = await sendSMS(
      ownerPhone,
      `✅ Job #${job_id?.slice(0, 8)} complete at ${jobAddress}. View photos in dashboard.`,
    );
    if (!ownerSmsOk) errors.push("Owner SMS failed");
    await logNotification(
      "owner",
      undefined,
      "sms",
      "job_complete",
      job_id,
      { job_id },
      ownerSmsOk ? "sent" : "failed",
    );
  }
  
  // Customer SMS (deduped by job_id)
  if (customerPhone && await shouldSendNotification("customer", "sms", "job_complete", job_id)) {
    const custSmsOk = await sendSMS(
      customerPhone,
      `✅ Your lawn service at ${jobAddress} is complete! Thank you for choosing Xcellent1 Lawn Care.`,
    );
    if (!custSmsOk) errors.push("Customer SMS failed");
    await logNotification(
      "customer",
      undefined,
      "sms",
      "job_complete",
      job_id,
      { job_id },
      custSmsOk ? "sent" : "failed",
    );
  }
  
  // Customer Email with photo (deduped by job_id)
  if (customerEmail && await shouldSendNotification("customer", "email", "job_complete", job_id)) {
    const html =
      `<h2>Your Lawn Service is Complete!</h2><p>Thank you for choosing Xcellent1 Lawn Care.</p>${photoUrl ? `<p><img src="${photoUrl}" alt="After photo" style="max-width:400px"></p>` : ""}<p>Rate your service: <a href="https://g.page/r/CZbYqiFFQ57SEBM/review">Leave a Review</a></p>`;
    const emailOk = await sendEmail(
      customerEmail,
      "Your Lawn Service is Complete!",
      html,
    );
    if (!emailOk) errors.push("Customer email failed");
    await logNotification(
      "customer",
      undefined,
      "email",
      "job_complete",
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
