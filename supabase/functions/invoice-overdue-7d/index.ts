import { sendEmail, logNotification, shouldSendNotification } from "../_shared/notifications.ts";

// Event: Invoice overdue 7 days
// Triggered by cron (daily)
// Sends: Customer email reminder

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { invoice_id, customer_email, customer_name, amount, due_date } = await req.json();

  if (!(await shouldSendNotification("customer", "email", "invoice_overdue_7d", invoice_id))) {
    return new Response(JSON.stringify({ ok: true, skipped: "Duplicate invoice_overdue_7d" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const html = `<h2>Payment Reminder</h2><p>Dear ${customer_name},</p><p>This is a friendly reminder that invoice #${invoice_id?.slice(0,8)} for $${amount} was due on ${due_date}.</p><p>Please submit payment at your earliest convenience.</p><p>Questions? Call us at (504) 875-8079.</p><p>Thank you,<br>Xcellent1 Lawn Care</p>`;
  const emailOk = await sendEmail(customer_email, "Payment Reminder - Xcellent1 Lawn Care", html);
  await logNotification("customer", undefined, "email", "invoice_overdue_7d", invoice_id, { invoice_id, amount }, emailOk ? "sent" : "failed");
  
  return new Response(JSON.stringify({ ok: emailOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
