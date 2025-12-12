import { load } from "https://deno.land/std@0.210.0/dotenv/mod.ts";
await load({ envPath: ".env.local", examplePath: null, export: true });

// supabase_auth.ts
// Supabase JWT validation for Deno (server-side)

import {
  decode as decodeJwt,
  verify,
} from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Prefer explicit server-side env vars but fall back to NEXT_PUBLIC_* if present
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ||
  "";
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  "";
export const SUPABASE_JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

let _supabase: any = null;
let _supabaseAdmin: any = null; // Service role client (bypasses RLS)
let _supabaseConfigured = false;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _supabaseConfigured = true;
    console.log("[supabase_auth] Supabase client initialized (URL present)");
  } catch (err) {
    console.error("[supabase_auth] Failed to initialize Supabase client:", err);
    _supabase = null;
    _supabaseConfigured = false;
  }
} else {
  console.warn(
    "[supabase_auth] Supabase env vars not provided - running without Supabase client",
  );
}

// Initialize admin client with service role key (bypasses RLS)
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log("[supabase_auth] Supabase Admin client initialized");
  } catch (err) {
    console.error(
      "[supabase_auth] Failed to initialize Supabase Admin client:",
      err,
    );
    _supabaseAdmin = null;
  }
}

export function getSupabaseClient() {
  return _supabase;
}

export function isSupabaseConfigured() {
  return _supabaseConfigured;
}

export interface AuthUser {
  id: string; // Supabase auth.uid()
  email: string;
  sub?: string; // JWT subject claim (user ID)
  role?: string;
  aud?: string;
  exp?: number;
}

/**
 * Verifies a Supabase JWT token and returns the user payload
 * @param authHeader Authorization header value (e.g., "Bearer <token>")
 * @returns User payload if valid, null otherwise
 */
export async function verifySupabaseJWT(
  authHeader: string,
): Promise<AuthUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    // Attempt fast decode first to check structure
    const decoded = decodeJwt(token);
    const payload = decoded[1];

    if (payload && (payload as any).sub) {
      // We have a plausible looking token.

      // If we have the JWT secret, verify signature locally (supports test tokens)
      if (SUPABASE_JWT_SECRET) {
        try {
          const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(SUPABASE_JWT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"],
          );

          // verify() returns the payload if valid, throws if invalid
          const verifiedPayload = await verify(token, key);
          if (verifiedPayload) {
            // Token is valid, return the payload with proper structure
            return {
              id: (verifiedPayload as any).sub || (verifiedPayload as any).id,
              email: (verifiedPayload as any).email || "",
              sub: (verifiedPayload as any).sub,
              role: (verifiedPayload as any).role,
              aud: (verifiedPayload as any).aud,
              exp: (verifiedPayload as any).exp,
            } as AuthUser;
          }
        } catch (verifyErr) {
          console.warn(
            "[supabase_auth] Local JWT verification failed:",
            verifyErr,
          );
          // Fall through to Supabase API verification
        }
      }
    }

    // Explicitly throw or return null here so we fall through to the getUser() check below
    if (!SUPABASE_JWT_SECRET) {
      console.warn(
        "WARNING: SUPABASE_JWT_SECRET not set, validation by signature not possible",
      );
    }

    // Fallback: Verify using Supabase Client getUser() (Key Rotation / Opaque Token support)
    // This is slower (network call) but authoritative.
    if (_supabase) {
      const { data: { user }, error } = await _supabase.auth.getUser(token);
      if (!error && user) {
        return user as unknown as AuthUser;
      }
    }

    // Last resort: decode if previously requested
    if (!SUPABASE_JWT_SECRET && !_supabase) {
      try {
        // Insecure decode for dev only
        const payload = decodeJwt(token)[1] as AuthUser;
        return payload;
      } catch {
        return null;
      }
    }

    return null;
  } catch (err) {
    console.error("JWT verification error:", err);
    // Try fallback here too
    if (_supabase) {
      try {
        const { data: { user }, error } = await _supabase.auth.getUser(token);
        if (!error && user) {
          return user as unknown as AuthUser;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

/**
 * Gets user profile data from database based on Supabase auth user ID
 * @param authUserId Supabase auth.uid()
 * @returns User profile with role information
 */
export async function getUserProfile(authUserId: string): Promise<any | null> {
  if (!_supabaseAdmin && !_supabase) {
    console.warn("[supabase_auth] No Supabase client available");
    return null;
  }

  // Use admin client to bypass RLS (avoids infinite recursion in policies)
  const client = _supabaseAdmin || _supabase;

  try {
    // First try to find by auth_user_id (normal Supabase Auth users)
    const { data, error } = await client
      .from("users")
      .select("id, email, name, role, auth_user_id")
      .eq("auth_user_id", authUserId)
      .single();

    // If not found by auth_user_id, try direct ID lookup (for test users with NULL auth_user_id)
    if (error || !data) {
      const directLookup = await client
        .from("users")
        .select("id, email, name, role, auth_user_id")
        .eq("id", authUserId)
        .single();

      if (!directLookup.error && directLookup.data) {
        return directLookup.data;
      }
    }

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[supabase_auth] Exception fetching user profile:", err);
    return null;
  }
}

/**
 * Middleware helper to extract and verify auth from request
 * @param req Request object
 * @returns User profile or null
 */
export async function authenticateRequest(
  req: Request,
): Promise<{ authUser: AuthUser; profile: any } | null> {
  if (!_supabaseConfigured) {
    console.warn(
      "[supabase_auth] authenticateRequest called but Supabase not configured",
    );
    return null;
  }

  const authHeader = req.headers.get("Authorization");
  console.log("[DEBUG] Auth header present:", !!authHeader);
  if (!authHeader) return null;

  const authUser = await verifySupabaseJWT(authHeader);
  console.log(
    "[DEBUG] JWT verified, authUser:",
    authUser ? `ID: ${authUser.sub || authUser.id}` : "null",
  );
  if (!authUser) return null;

  const profile = await getUserProfile(authUser.id || (authUser as any).sub);
  console.log(
    "[DEBUG] Profile fetched:",
    profile ? `Role: ${profile.role}, Email: ${profile.email}` : "null",
  );
  if (!profile) return null;

  return { authUser, profile };
}
