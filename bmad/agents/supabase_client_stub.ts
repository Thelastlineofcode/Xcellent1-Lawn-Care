// Supabase client stub for agents (Deno)
// TODO: replace with actual @supabase/supabase-js for Deno when ready and store keys in secrets

export async function insertLead(lead: Record<string, any>) {
  console.log("[supabase-stub] insertLead", lead);
  return { id: `lead_${Date.now()}` };
}

export async function insertOutboxEvent(event: Record<string, any>) {
  console.log("[supabase-stub] insertOutboxEvent", event);
  return { id: `outbox_${Date.now()}` };
}

export async function createInvoice(invoice: Record<string, any>) {
  console.log("[supabase-stub] createInvoice", invoice);
  return { id: `inv_${Date.now()}` };
}
