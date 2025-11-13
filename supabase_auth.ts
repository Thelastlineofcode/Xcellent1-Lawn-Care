// supabase_auth.ts
// Minimal Supabase JWT validation for Deno (server-side)

import { decode as decodeJwt } from "https://deno.land/x/djwt@v2.8/mod.ts";

const SUPABASE_JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || "";

export async function verifySupabaseJWT(authHeader: string): Promise<any | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    // NOTE: This does NOT verify signature (for demo/dev only)
    // For production, use djwt.verify(token, secret) with the correct secret
    const payload = decodeJwt(token)[1] as Record<string, unknown>;
    return payload;
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
}
