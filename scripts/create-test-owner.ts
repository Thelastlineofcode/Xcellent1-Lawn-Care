#!/usr/bin/env -S deno run --allow-env --allow-net

// Create test owner account using Supabase Admin API

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SERVICE_ROLE_KEY ? "✓" : "✗");
  Deno.exit(1);
}

console.log("🔧 Creating test owner account...\n");

// Step 1: Create auth user
console.log("Step 1: Creating Supabase Auth user...");
const createUserResponse = await fetch(
  `${SUPABASE_URL}/auth/v1/admin/users`,
  {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "test@xcellent1.com",
      password: "Test123!@#",
      email_confirm: true,
      user_metadata: {
        name: "Test Owner",
      },
    }),
  },
);

const authUser = await createUserResponse.json();

if (!createUserResponse.ok) {
  console.error("❌ Failed to create auth user:", authUser);

  // Check if user already exists
  if (
    authUser.msg?.includes("already registered") ||
    authUser.message?.includes("already registered")
  ) {
    console.log("ℹ️  User already exists, fetching existing user...");

    // List users to find the existing one
    const listResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
      },
    );

    const users = await listResponse.json();
    const existingUser = users.users?.find((u: any) =>
      u.email === "test@xcellent1.com"
    );

    if (existingUser) {
      console.log("✓ Found existing user:", existingUser.id);
      console.log("\nStep 2: Creating/updating user profile...");

      // Update the users table
      const profileResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/users?auth_user_id=eq.${existingUser.id}`,
        {
          method: "POST",
          headers: {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            auth_user_id: existingUser.id,
            email: "test@xcellent1.com",
            name: "Test Owner",
            role: "owner",
            status: "active",
          }),
        },
      );

      if (profileResponse.ok) {
        console.log("✓ Profile updated successfully\n");
      } else {
        const error = await profileResponse.text();
        console.log("Profile update response:", error);
      }

      console.log("✅ Test owner account ready!\n");
      console.log("📧 Email: test@xcellent1.com");
      console.log("🔑 Password: Test123!@#");
      console.log(
        "🔗 Login: https://xcellent1lawncare.com/static/login.html\n",
      );
      Deno.exit(0);
    }
  }

  Deno.exit(1);
}

console.log("✓ Auth user created:", authUser.id);

// Step 2: Create user profile in users table
console.log("\nStep 2: Creating user profile in database...");
const profileResponse = await fetch(
  `${SUPABASE_URL}/rest/v1/users`,
  {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      auth_user_id: authUser.id,
      email: "test@xcellent1.com",
      name: "Test Owner",
      role: "owner",
      status: "active",
    }),
  },
);

if (!profileResponse.ok) {
  const error = await profileResponse.text();
  console.error("❌ Failed to create profile:", error);
  Deno.exit(1);
}

const profile = await profileResponse.json();
console.log("✓ Profile created:", profile[0]?.id);

console.log("\n✅ Test owner account created successfully!\n");
console.log("📧 Email: test@xcellent1.com");
console.log("🔑 Password: Test123!@#");
console.log("🔗 Login: https://xcellent1lawncare.com/static/login.html\n");
