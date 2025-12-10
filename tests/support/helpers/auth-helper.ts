// Authentication Helper - Following test-quality.md patterns
// Provides clean authentication setup for tests

import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

export interface AuthToken {
  token: string;
  userId: string;
  role: string;
}

/**
 * Generate a JWT token for testing
 * Follows deterministic patterns - no randomness in core claims
 */
export async function generateTestToken(role: 'owner' | 'crew' | 'client', userId: string): Promise<AuthToken> {
  const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET");
  if (!JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET required for test authentication");
  }
  
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iss: "supabase",
    iat: now,
    exp: now + 3600, // 1 hour
    aud: "authenticated",
    role: "authenticated",
    user_metadata: { role }
  };
  
  const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);
  
  return {
    token,
    userId,
    role
  };
}

/**
 * Create authenticated fetch headers
 */
export function createAuthHeaders(token: string) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

/**
 * Validate token structure (for testing token generation)
 */
export function validateTokenStructure(token: string): boolean {
  try {
    const parts = token.split('.');
    return parts.length === 3;
  } catch {
    return false;
  }
}
