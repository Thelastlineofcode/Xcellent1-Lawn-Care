import {
  sendSMS,
  logNotification,
  NotificationEvent,
  shouldSendNotification,
} from "../_shared/notifications.ts";

// Event: New quote request submitted (high-score lead)
// Triggers: Owner SMS if lead score > 70

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const event: NotificationEvent = await req.json();
  const { lead_id, payload } = event;
  
  const ownerPhone = Deno.env.get("OWNER_PHONE") || "";
  const leadName = (payload.name as string) || "New Lead";
  const leadPhone = (payload.phone as string) || "";
  const leadScore = (payload.score as number) || 0;
  
  // Only alert owner if lead score > 70
  if (leadScore <= 70) {
    return new Response(JSON.stringify({ ok: true, skipped: "Low score lead, queued for daily digest" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (!(await shouldSendNotification("owner", "sms", "lead_alert", lead_id))) {
    return new Response(JSON.stringify({ ok: true, skipped: "Duplicate lead_alert" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const smsOk = await sendSMS(
    ownerPhone,
    `🔥 High-score lead: ${leadName} (${leadScore}/100). Phone: ${leadPhone}`,
  );
  await logNotification(
    "owner",
    undefined,
    "sms",
    "lead_alert",
    lead_id,
    { lead_id, score: leadScore },
    smsOk ? "sent" : "failed",
  );
  
  return new Response(JSON.stringify({ ok: smsOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
