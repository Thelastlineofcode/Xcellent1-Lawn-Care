-- Create owner invitation for La Cardio Francis
-- Run this in Supabase SQL Editor

INSERT INTO owner_invitations (email, name, phone, invitation_token, status)
VALUES (
  'lacardiofrancis@gmail.com',
  'La Cardio Francis',
  '(504) 875-8079',
  'owner-invite-' || gen_random_uuid()::text,
  'pending'
)
RETURNING id, email, invitation_token, expires_at;
