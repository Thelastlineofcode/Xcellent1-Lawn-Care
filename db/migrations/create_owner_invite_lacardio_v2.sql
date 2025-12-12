-- Create NEW owner invitation for La Cardio Francis (v2)
-- Run this in Supabase SQL Editor

-- 1. Expire old pending invitations to avoid confusion
UPDATE owner_invitations 
SET status = 'expired' 
WHERE email = 'lacardiofrancis@gmail.com' AND status = 'pending';

-- 2. Insert new invitation
INSERT INTO owner_invitations (email, name, phone, invitation_token, status)
VALUES (
  'lacardiofrancis@gmail.com',
  'La Cardio Francis',
  '(504) 875-8079',
  'owner-invite-' || gen_random_uuid()::text,
  'pending'
)
RETURNING 
  id, 
  email, 
  invitation_token, 
  expires_at,
  'http://localhost:8000/static/owner-setup.html?token=' || invitation_token as local_setup_link;
