-- Dealer self-signup, mirroring the seller pre-account-verification pattern:
-- no auth user or dealer_businesses row exists until the email is verified,
-- so "change email" is just editing this row rather than renaming an
-- already-created account. Consumed (deleted) once the dealer completes
-- signup with a password.
create table dealer_signup_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  email text not null unique,
  phone text,
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Verification lives at the business level, separate from the existing
-- verified/active booleans on dealers/dealer_businesses (those stay exactly
-- as they are for their current, admin-curated purpose on pricing pages).
-- A self-signed-up business starts 'pending' and is invisible to the new
-- /dealers directory until an admin approves it.
alter table dealer_businesses add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'verified', 'rejected'));
alter table dealer_businesses add column if not exists rejection_reason text;

-- Existing admin-created businesses should not retroactively disappear from
-- anything -- they're already trusted by construction (an admin made them).
update dealer_businesses set verification_status = 'verified' where verified = true;

notify pgrst, 'reload schema';
