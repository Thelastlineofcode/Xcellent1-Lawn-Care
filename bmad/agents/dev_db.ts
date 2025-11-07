// Simple file-backed dev DB for local MVP runs.
// Stores leads, outbox events, invoices in a JSON file under bmad/agents/dev_db.json

// Use decodeURIComponent to handle spaces in file paths on macOS
const DB_PATH = decodeURIComponent(
  new URL("./dev_db.json", import.meta.url).pathname
);

async function readDB() {
  try {
    const raw = await Deno.readTextFile(DB_PATH);
    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return { leads: [], events_outbox: [], invoices: [] };
    }
    throw err;
  }
}

async function writeDB(db: any) {
  const tmp = DB_PATH + ".tmp";
  // ensure parent directory exists
  try {
    await Deno.mkdir(new URL("./", import.meta.url).pathname, {
      recursive: true,
    });
  } catch (_err) {
    // ignore
  }
  await Deno.writeTextFile(tmp, JSON.stringify(db, null, 2));
  await Deno.rename(tmp, DB_PATH);
  return db;
}

function genId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export async function insertLead(lead: Record<string, any>) {
  const db = await readDB();
  const id = genId("lead");
  const row = { id, ...lead };
  db.leads.push(row);
  await writeDB(db);
  return { id };
}

export async function insertOutboxEvent(event: Record<string, any>) {
  const db = await readDB();
  const id = genId("outbox");
  const row = {
    id,
    status: "pending",
    attempts: 0,
    created_at: new Date().toISOString(),
    payload: event.payload || event,
    type: event.type || (event.type ?? "generic"),
  };
  db.events_outbox.push(row);
  await writeDB(db);
  return { id };
}

export async function createInvoice(inv: Record<string, any>) {
  const db = await readDB();
  const id = genId("inv");
  const row = { id, ...inv };
  db.invoices.push(row);
  await writeDB(db);
  return { id };
}

export async function fetchPendingOutbox(now: Date = new Date()) {
  const db = await readDB();
  // select pending events where next_attempt_at is null or <= now
  return db.events_outbox.filter((e: Record<string, any>) => {
    if (e.status === "success") return false;
    if (!e.next_attempt_at) return true;
    return new Date(e.next_attempt_at) <= now;
  });
}

export async function updateOutboxEvent(
  id: string,
  patch: Record<string, any>
) {
  const db = await readDB();
  const idx = db.events_outbox.findIndex(
    (e: Record<string, any>) => e.id === id
  );
  if (idx === -1) throw new Error("outbox event not found: " + id);
  db.events_outbox[idx] = { ...db.events_outbox[idx], ...patch };
  await writeDB(db);
  return db.events_outbox[idx];
}

export async function getLeadById(id: string) {
  const db = await readDB();
  return db.leads.find((l: Record<string, any>) => l.id === id) || null;
}

export async function resetDB() {
  const initial = { leads: [], events_outbox: [], invoices: [] };
  await writeDB(initial);
  return initial;
}
