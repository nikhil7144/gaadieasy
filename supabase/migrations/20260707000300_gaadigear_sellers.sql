create table if not exists gear_brands (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  name text not null,
  slug text not null unique,
  logo_url text,
  is_oem boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Business entity. Mirrors the shape of `dealers`, but (unlike dealers) gets a
-- public self-signup flow -- see lib/services/seller-auth in Phase 3.
create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  brand_name text,
  business_type text,
  gstin text,
  pan text,
  kyc_status text not null default 'pending_review',
  kyc_rejection_reason text,
  contact_email text,
  contact_phone text,
  logo_url text,
  status text not null default 'onboarding',
  commission_pct numeric(5,2) not null default 10,
  created_at timestamptz not null default now()
);

alter table if exists gear_brands
add constraint gear_brands_seller_id_fkey foreign key (seller_id) references sellers(id);

-- Join table linking real auth.users logins to a seller business, mirroring
-- dealer_users' shape (business_admin vs staff role) but with a tracked migration,
-- unlike dealer_users which was created out-of-band.
create table if not exists seller_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  seller_id uuid not null references sellers(id) on delete cascade,
  role text not null default 'seller_owner' check (role in ('seller_owner', 'seller_staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists seller_kyc_documents (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  doc_type text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists seller_bank_details (
  seller_id uuid primary key references sellers(id) on delete cascade,
  account_holder text,
  account_number_enc text,
  ifsc text,
  upi_id text,
  payout_cycle text not null default 'weekly'
);

create table if not exists seller_shipping_settings (
  seller_id uuid primary key references sellers(id) on delete cascade,
  ships_pan_india boolean not null default true,
  excluded_states text[] not null default '{}'::text[],
  excluded_pincodes text[] not null default '{}'::text[],
  fee_type text not null default 'flat' check (fee_type in ('flat', 'free', 'threshold')),
  flat_fee numeric(10,2) not null default 0,
  free_shipping_above numeric(10,2),
  standard_delivery_days integer not null default 5,
  cod_available boolean not null default false,
  updated_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
