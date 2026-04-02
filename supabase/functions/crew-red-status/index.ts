import { sendSMS, logNotification, shouldSendNotification } from "../_shared/notifications.ts";

// Event: Crew red status — Owner SMS + Crew self-view update
// Triggered when performance score drops below threshold

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const { worker_id, worker_name, worker_phone, period_start, period_end, quality_score, jobs_on_time, jobs_completed } = await req.json();
  
  const ownerPhone = Deno.env.get("OWNER_PHONE") || "";
  
  // Owner SMS alert (deduped by worker_id for the event)
  let ownerSmsOk = true;
  if (await shouldSendNotification("owner", "sms", "crew_red_status", worker_id)) {
    ownerSmsOk = await sendSMS(
      ownerPhone,
      `🔴 Red status alert: ${worker_name}. Quality: ${quality_score || "N/A"}. On-time: ${jobs_on_time}/${jobs_completed}. Period: ${period_start} to ${period_end}`,
    );
    await logNotification(
      "owner",
      undefined,
      "sms",
      "crew_red_status",
      worker_id,
      { worker_id, worker_name },
      ownerSmsOk ? "sent" : "failed",
    );
  }
  
  // Crew self-view SMS (deduped by worker_id for the event)
  if (worker_phone && await shouldSendNotification("crew", "sms", "crew_red_status", worker_id)) {
    const crewSmsOk = await sendSMS(
      worker_phone,
      `🔴 Your performance status is RED. Quality: ${quality_score || "N/A"}. On-time: ${jobs_on_time}/${jobs_completed}. Please contact your supervisor.`,
    );
    await logNotification(
      "crew",
      worker_id,
      "sms",
      "crew_red_status",
      worker_id,
      { worker_id },
      crewSmsOk ? "sent" : "failed",
    );
  }
  
  return new Response(JSON.stringify({ ok: ownerSmsOk }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
