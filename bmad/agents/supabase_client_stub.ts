// Supabase client stub for agents (Deno)
// TODO: replace with actual @supabase/supabase-js for Deno when ready and store keys in secrets

import * as devdb from "./dev_db.ts";

export async function insertLead(lead: Record<string, any>) {
  console.log("[supabase-stub] insertLead", lead);
  return devdb.insertLead(lead);
}

export async function insertOutboxEvent(event: Record<string, any>) {
  console.log("[supabase-stub] insertOutboxEvent", event);
  return devdb.insertOutboxEvent(event);
}

export async function createInvoice(invoice: Record<string, any>) {
  console.log("[supabase-stub] createInvoice", invoice);
  return devdb.createInvoice(invoice);
}

export async function fetchPendingOutbox(now = new Date()) {
  return devdb.fetchPendingOutbox(now);
}

export async function updateOutboxEvent(
  id: string,
  patch: Record<string, any>
) {
  return devdb.updateOutboxEvent(id, patch);
}

export async function getLeadById(id: string) {
  return devdb.getLeadById(id);
}
