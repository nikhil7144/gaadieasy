-- Holds a prospective seller's email + business name until they click the
-- verification link -- no auth user or `sellers` row exists until then, so
-- "change email" is just editing this row rather than renaming an already
-- created account. Consumed (deleted) once signUpSeller creates the real
-- account.
create table gear_seller_signup_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  email text not null unique,
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
