import {
  sendSMS,
  sendEmail,
  logNotification,
  shouldSendNotification,
} from "../_shared/notifications.ts";

// Event: Invoice overdue 14 days
// Triggered by cron (daily)
// Sends: Owner SMS alert + Customer email escalation

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { invoice_id, customer_email, customer_name, amount, due_date } = await req.json();
  
  const ownerPhone = Deno.env.get("OWNER_PHONE") || "";
  
  // Owner SMS escalation (deduped by invoice_id)
  let ownerSmsOk = true;
  if (await shouldSendNotification("owner", "sms", "invoice_overdue_14d", invoice_id)) {
    ownerSmsOk = await sendSMS(
      ownerPhone,
      `⚠️ Invoice ${invoice_id?.slice(0, 8)} is 14 days overdue: $${amount} from ${customer_name}`,
    );
    await logNotification(
      "owner",
      undefined,
      "sms",
      "invoice_overdue_14d",
      invoice_id,
      { invoice_id, amount },
      ownerSmsOk ? "sent" : "failed",
    );
  }
  
  // Customer email escalation (deduped by invoice_id)
  let emailOk = true;
  if (await shouldSendNotification("customer", "email", "invoice_overdue_14d", invoice_id)) {
    const html =
      `<h2>Urgent: Overdue Invoice</h2><p>Dear ${customer_name},</p><p>Invoice #${invoice_id?.slice(0, 8)} for $${amount} was due on ${due_date} and is now 14 days overdue.</p><p>Please submit payment immediately to avoid service interruption.</p><p>Call us at (504) 875-8079 to discuss payment options.</p>`;
    emailOk = await sendEmail(
      customer_email,
      "URGENT: Overdue Invoice - Xcellent1 Lawn Care",
      html,
    );
    await logNotification(
      "customer",
      undefined,
      "email",
      "invoice_overdue_14d",
      invoice_id,
      { invoice_id, amount },
      emailOk ? "sent" : "failed",
    );
  }
  
  return new Response(JSON.stringify({ ok: ownerSmsOk && emailOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
