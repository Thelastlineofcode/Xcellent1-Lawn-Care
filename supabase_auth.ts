// supabase_auth.ts
// Supabase JWT validation for Deno (server-side)

import { verify, decode as decodeJwt } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";
const SUPABASE_JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET") || "";

// Initialize Supabase client for server-side operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AuthUser {
  id: string; // Supabase auth.uid()
  email: string;
  role?: string;
  aud?: string;
  exp?: number;
}

/**
 * Verifies a Supabase JWT token and returns the user payload
 * @param authHeader Authorization header value (e.g., "Bearer <token>")
 * @returns User payload if valid, null otherwise
 */
export async function verifySupabaseJWT(authHeader: string): Promise<AuthUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    // Verify JWT signature with Supabase JWT secret
    if (SUPABASE_JWT_SECRET) {
      const payload = await verify(
        token,
        new TextEncoder().encode(SUPABASE_JWT_SECRET),
        "HS256"
      ) as AuthUser;

      return payload;
    } else {
      // Fallback: decode without verification (DEV ONLY - not secure!)
      console.warn("WARNING: SUPABASE_JWT_SECRET not set, using insecure JWT decode");
      const payload = decodeJwt(token)[1] as AuthUser;
      return payload;
    }
  } catch (err) {
    console.error("JWT verification error:", err);
    return null;
  }
}

/**
 * Gets user profile data from database based on Supabase auth user ID
 * @param authUserId Supabase auth.uid()
 * @returns User profile with role information
 */
export async function getUserProfile(authUserId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, status, auth_user_id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Middleware helper to extract and verify auth from request
 * @param req Request object
 * @returns User profile or null
 */
export async function authenticateRequest(req: Request): Promise<{ authUser: AuthUser, profile: any } | null> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) return null;

  const authUser = await verifySupabaseJWT(authHeader);
  if (!authUser) return null;

  const profile = await getUserProfile(authUser.id || authUser.sub as string);
  if (!profile) return null;

  return { authUser, profile };
}
