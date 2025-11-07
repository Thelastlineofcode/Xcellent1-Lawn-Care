// Simple file-backed dev DB for local MVP runs.
// Stores leads, outbox events, invoices in a JSON file under bmad/agents/dev_db.json

// Handle both encoded and decoded file paths so tests and runtime can read the file
const RAW_DB_PATH = new URL("./dev_db.json", import.meta.url).pathname;
const DB_PATH = decodeURIComponent(RAW_DB_PATH);

async function readDB() {
  try {
    // prefer decoded path if it exists, otherwise fallback to raw path
    let usePath = DB_PATH;
    try {
      await Deno.stat(DB_PATH);
    } catch (_e) {
      usePath = RAW_DB_PATH;
    }
    const raw = await Deno.readTextFile(usePath);
    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return { leads: [], events_outbox: [], invoices: [] };
    }
    throw err;
  }
}

async function writeDB(db: unknown) {
  const parentDir = new URL("./", import.meta.url).pathname;
  try {
    await Deno.mkdir(parentDir, { recursive: true });
  } catch (_err) {
    // ignore
  }
  const content = JSON.stringify(db, null, 2);
  // write both decoded and raw paths to be compatible with different URL.pathname behavior
  const tmpDecoded = DB_PATH + ".tmp";
  const tmpRaw = RAW_DB_PATH + ".tmp";
  await Deno.writeTextFile(tmpDecoded, content);
  await Deno.rename(tmpDecoded, DB_PATH);
  // also write raw path if different
  if (RAW_DB_PATH !== DB_PATH) {
    await Deno.writeTextFile(tmpRaw, content);
    await Deno.rename(tmpRaw, RAW_DB_PATH);
  }
  return db;
}

function genId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export async function insertLead(lead: Record<string, unknown>) {
  const db = await readDB();
  const id = genId("lead");
  const row = { id, ...lead };
  db.leads.push(row);
  await writeDB(db);
  return { id };
}

export async function insertOutboxEvent(event: Record<string, unknown>) {
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

export async function createInvoice(inv: Record<string, unknown>) {
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
  return db.events_outbox.filter((e: Record<string, unknown>) => {
    if ((e as any).status === "success") return false;
    if (!(e as any).next_attempt_at) return true;
    return new Date((e as any).next_attempt_at) <= now;
  });
}

export async function updateOutboxEvent(
  id: string,
  patch: Record<string, unknown>
) {
  const db = await readDB();
  const idx = db.events_outbox.findIndex(
    (e: Record<string, unknown>) => (e as any).id === id
  );
  if (idx === -1) throw new Error("outbox event not found: " + id);
  db.events_outbox[idx] = { ...db.events_outbox[idx], ...patch };
  await writeDB(db);
  return db.events_outbox[idx];
}

export async function getLeadById(id: string) {
  const db = await readDB();
  return (
    db.leads.find((l: Record<string, unknown>) => (l as any).id === id) || null
  );
}

export async function resetDB() {
  const initial = { leads: [], events_outbox: [], invoices: [] };
  await writeDB(initial);
  return initial;
}
