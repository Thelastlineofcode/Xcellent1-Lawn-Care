import * as stub from "../supabase_client_stub.ts";
import * as devdb from "../dev_db.ts";

Deno.test("outbox stub - insert, fetch pending, update", async () => {
  // reset DB to a clean state
  await devdb.resetDB();

  // insert an outbox event
  const r = await stub.insertOutboxEvent({
    type: "TEST_EVENT",
    payload: { hello: "world" },
  });
  if (!r || !r.id) throw new Error("failed to insert outbox event");
  const id = r.id;

  // fetch pending events
  const pending = await stub.fetchPendingOutbox(new Date());
  if (!Array.isArray(pending) || pending.length !== 1) {
    throw new Error(`expected 1 pending event, got ${JSON.stringify(pending)}`);
  }

  // update the event (simulate a failed attempt scheduling retry)
  const patch = {
    attempts: 1,
    next_attempt_at: new Date(Date.now() + 60 * 1000).toISOString(),
  };
  const updated = await stub.updateOutboxEvent(id, patch);
  if (!updated || updated.attempts !== 1) {
    throw new Error(
      `expected attempts=1 after update, got ${JSON.stringify(updated)}`
    );
  }

  // verify persisted in dev_db file
  const dbPath = new URL("../dev_db.json", import.meta.url).pathname;
  const txt = await Deno.readTextFile(dbPath);
  const db = JSON.parse(txt);
  const found = db.events_outbox.find(
    (e: Record<string, unknown>) => (e as any).id === id
  );
  if (!found) throw new Error("updated event not found in db");
  if (found.attempts !== 1) throw new Error("attempts not persisted");
});
