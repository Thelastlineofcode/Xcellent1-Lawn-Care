// Outbox worker (Deno) - polls events_outbox and dispatches messages with retry/backoff.
import {
  fetchPendingOutbox,
  updateOutboxEvent,
  hasRealSupabase,
} from "../lib/supabase.ts";

console.log("[outbox-agent] starting worker");

async function sendIntegration(event: any) {
  // Dev-safe: if no real integration keys present, simulate success
  const hasSendKey =
    !!Deno.env.get("SENDGRID_API_KEY") || !!Deno.env.get("TWILIO_AUTH_TOKEN");
  console.log("[outbox-agent] delivering event", event.id, event.type);
  if (!hasSendKey) {
    console.log(
      "[outbox-agent] no provider keys, simulating delivery (dev mode)"
    );
    return { ok: true, provider: "dev" };
  }
  // TODO: implement real SendGrid/Twilio calls here using env keys
  // For now, simulate success
  return { ok: true, provider: "simulated" };
}

async function processBatch() {
  try {
    const now = new Date();
    const pending = await fetchPendingOutbox(now).catch((e) => {
      console.error("[outbox-agent] fetchPendingOutbox failed", e);
      return [];
    });
    if (!pending || !pending.length) return;
    for (const ev of pending) {
      const attempts = (ev.attempts || 0) + 1;
      try {
        const res = await sendIntegration(ev.payload || ev);
        if (res.ok) {
          await updateOutboxEvent(ev.id, {
            status: "success",
            attempts,
            last_attempt_at: new Date().toISOString(),
          }).catch(console.error);
          console.log(`[outbox-agent] delivered event ${ev.id}`);
        } else {
          const nextDelayMin = Math.pow(2, attempts);
          const nextAttempt = new Date(
            Date.now() + nextDelayMin * 60 * 1000
          ).toISOString();
          await updateOutboxEvent(ev.id, {
            attempts,
            next_attempt_at: nextAttempt,
            last_attempt_at: new Date().toISOString(),
          }).catch(console.error);
          console.log(
            `[outbox-agent] scheduled retry for ${ev.id} in ${nextDelayMin} minutes`
          );
        }
      } catch (err) {
        console.error("[outbox-agent] error delivering event", ev.id, err);
        const nextDelayMin = Math.pow(2, attempts);
        const nextAttempt = new Date(
          Date.now() + nextDelayMin * 60 * 1000
        ).toISOString();
        await updateOutboxEvent(ev.id, {
          attempts,
          next_attempt_at: nextAttempt,
          last_attempt_at: new Date().toISOString(),
        }).catch(console.error);
      }
    }
  } catch (err) {
    console.error("[outbox-agent] processBatch failed", err);
  }
}

if (import.meta.main) {
  // poll every 30 seconds by default in the worker; on Deno Deploy use schedule cron
  setInterval(() => processBatch().catch(console.error), 30 * 1000);
}
