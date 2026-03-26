#!/bin/bash
# Set Supabase secrets in Fly.io
# Get these values from: https://supabase.com/dashboard/project/utivthfrwgtjatsusopw/settings/api

echo "🔧 Setting Supabase secrets in Fly.io..."
echo ""
echo "📋 You need to get these values from Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/utivthfrwgtjatsusopw/settings/api"
echo ""

# SUPABASE_URL (this one is known)
echo "Setting SUPABASE_URL..."
fly secrets set SUPABASE_URL="https://utivthfrwgtjatsusopw.supabase.co"

echo ""
echo "⚠️  Now you need to set the following secrets manually:"
echo ""
echo "1. Get SUPABASE_ANON_KEY from: Settings > API > Project API keys > anon public"
echo "   Then run: fly secrets set SUPABASE_ANON_KEY='<paste_key_here>'"
echo ""
echo "2. Get SUPABASE_SERVICE_ROLE_KEY from: Settings > API > Project API keys > service_role"
echo "   Then run: fly secrets set SUPABASE_SERVICE_ROLE_KEY='<paste_key_here>'"
echo ""
echo "3. Get SUPABASE_JWT_SECRET from: Settings > API > JWT Settings > JWT Secret"
echo "   Then run: fly secrets set SUPABASE_JWT_SECRET='<paste_secret_here>'"
echo ""
echo "4. Get DATABASE_URL from: Settings > Database > Connection string > URI"
echo "   Then run: fly secrets set DATABASE_URL='<paste_url_here>'"
echo ""
echo "✅ After setting all secrets, the app will automatically redeploy."
