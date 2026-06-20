import {
  sendSMS,
  logNotification,
  NotificationEvent,
  shouldSendNotification,
} from "../_shared/notifications.ts";

// Event: New worker application
// Triggers: Owner SMS

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const event: NotificationEvent = await req.json();
  const { payload } = event;
  
  const ownerPhone = Deno.env.get("OWNER_PHONE") || "";
  const applicantName = (payload.name as string) || "New Applicant";
  const applicantPhone = (payload.phone as string) || "";
  
  // Prefer a stable ref for dedupe; fall back to phone if no id present.
  const refId = (payload.id as string) || applicantPhone || undefined;

  if (!(await shouldSendNotification("owner", "sms", "worker_application", refId))) {
    return new Response(JSON.stringify({ ok: true, skipped: "Duplicate worker_application" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const smsOk = await sendSMS(
    ownerPhone,
    `👷 New worker application: ${applicantName}. Phone: ${applicantPhone}`,
  );
  await logNotification(
    "owner",
    undefined,
    "sms",
    "worker_application",
    refId,
    { applicant_name: applicantName },
    smsOk ? "sent" : "failed",
  );
  
  return new Response(JSON.stringify({ ok: smsOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
