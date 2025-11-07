// Supabase client stub for agents (Deno)
// TODO: replace with actual @supabase/supabase-js for Deno when ready and store keys in secrets

import * as devdb from "./dev_db.ts";

export function insertLead(lead: Record<string, unknown>) {
  console.log("[supabase-stub] insertLead", lead);
  return devdb.insertLead(lead as Record<string, unknown>);
}

export function insertOutboxEvent(event: Record<string, unknown>) {
  console.log("[supabase-stub] insertOutboxEvent", event);
  return devdb.insertOutboxEvent(event as Record<string, unknown>);
}

export function createInvoice(invoice: Record<string, unknown>) {
  console.log("[supabase-stub] createInvoice", invoice);
  return devdb.createInvoice(invoice as Record<string, unknown>);
}

export function fetchPendingOutbox(now = new Date()) {
  return devdb.fetchPendingOutbox(now);
}

export function updateOutboxEvent(id: string, patch: Record<string, unknown>) {
  return devdb.updateOutboxEvent(id, patch as Record<string, unknown>);
}

export function getLeadById(id: string) {
  return devdb.getLeadById(id);
}
