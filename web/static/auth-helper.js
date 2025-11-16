// auth-helper.js
// Reusable authentication helper for all dashboard pages
// This script should be imported as a module in each protected page

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Use runtime-injected values (via /config.js) when available, otherwise
// fall back to the old hard-coded defaults (useful for local dev).
const _env = (typeof window !== "undefined" && window.__ENV) || {};
const SUPABASE_URL =
  _env.NEXT_PUBLIC_SUPABASE_URL || "https://utivthfrwgtjatsusopw.supabase.co";
const SUPABASE_ANON_KEY =
  _env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXZ0aGZyd2d0amF0c3Vzb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTA4NDEsImV4cCI6MjA3ODEyNjg0MX0.hcIzoqBwYSMC-571NRBAd_WMQZumuxavJ282nCNQ7QM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Check if user is authenticated and has the required role
 * @param {string|string[]} requiredRoles - Required role(s) for access
 * @param {string} greetingSelector - CSS selector for greeting element (optional)
 * @returns {Promise<object>} User profile object
 */
export async function requireAuth(requiredRoles, greetingSelector = null) {
  // Normalize to array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Not logged in, redirect to login
    window.location.href = "/static/login.html";
    throw new Error("Not authenticated");
  }

  // Get user profile and verify role
  const { data: profile, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, auth_user_id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (error || !profile) {
    // No profile found, logout and redirect
    await supabase.auth.signOut();
    alert("User profile not found. Please contact support.");
    window.location.href = "/static/login.html";
    throw new Error("Profile not found");
  }

  if (!roles.includes(profile.role)) {
    // Invalid role, logout and redirect
    await supabase.auth.signOut();
    alert(`Access denied. This page is only for ${roles.join(" or ")}s.`);
    window.location.href = "/static/login.html";
    throw new Error("Invalid role");
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    alert("Your account is not active. Please contact support.");
    window.location.href = "/static/login.html";
    throw new Error("Account not active");
  }

  // Store user info and session globally
  window.userProfile = profile;
  window.supabaseSession = session;
  window.supabaseClient = supabase;

  // Update greeting if selector provided
  if (greetingSelector) {
    const greetingEl = document.querySelector(greetingSelector);
    if (greetingEl) {
      greetingEl.textContent = `Welcome back, ${profile.name}!`;
    }
  }

  return profile;
}

/**
 * Logout current user and redirect to login
 */
export async function logout() {
  await supabase.auth.signOut();
  // Clear local storage
  localStorage.removeItem("user_profile");
  window.location.href = "/static/login.html";
}

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const session = window.supabaseSession;

  if (!session) {
    throw new Error("No active session");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.access_token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Export logout to window for onclick handlers
window.logout = logout;
