#!/bin/bash
# Security Fix: Remove hardcoded Supabase credentials from frontend files

echo "🔒 Removing hardcoded Supabase credentials from frontend files..."

# Define the files that need to be fixed
FILES=(
  "web/static/owner.html"
  "web/static/manage-clients.html"
  "web/static/pending-payments.html"
  "web/static/manage-waitlist.html"
  "web/static/auth-helper.js"
  "web/static/login.html"
)

# The hardcoded key pattern to remove (replace with placeholder)
OLD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXZ0aGZyd2d0amF0c3Vzb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTA4NDEsImV4cCI6MjA3ODEyNjg0MX0.hcIzoqBwYSMC-571NRBAd_WMQZumuxavJ282nCNQ7QM"
NEW_KEY="YOUR_SUPABASE_ANON_KEY_HERE"

# Replace in all files
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing: $file"
    sed -i '' "s|$OLD_KEY|$NEW_KEY|g" "$file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ Security fix complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify all files load config from /config.js"
echo "2. Ensure fallback keys are placeholders only"
echo "3. Test with actual credentials from environment variables"
