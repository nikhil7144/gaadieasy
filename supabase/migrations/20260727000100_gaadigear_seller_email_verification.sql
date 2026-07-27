-- Tracks whether a seller has actually clicked their email verification link,
-- independent of Supabase Auth's own email_confirmed_at -- the auth user is
-- created pre-confirmed (email_confirm: true) so the signup wizard's
-- immediate signInWithPassword keeps working, so real verification is
-- tracked here instead and sent via a custom Resend email + token.
alter table sellers add column if not exists email_verification_token text;
alter table sellers add column if not exists email_verified_at timestamptz;

notify pgrst, 'reload schema';
