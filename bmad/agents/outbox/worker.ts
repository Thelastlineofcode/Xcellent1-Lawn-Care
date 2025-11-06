// Outbox worker (Deno) - scans events_outbox and dispatches messages (stub)
console.log("[outbox-agent] starting worker (stub)");

async function processNext() {
  console.log("[outbox-agent] polling events_outbox (stub)");
  // TODO: query Supabase events_outbox where status != success and next_attempt_at <= now
  // For each event: call integration (SendGrid/Twilio), mark success/failure with attempts
}

if (import.meta.main) {
  // simple loop for local dev (stub)
  setInterval(() => processNext().catch(console.error), 5000);
}
