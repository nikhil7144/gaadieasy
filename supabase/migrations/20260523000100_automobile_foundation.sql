create table if not exists vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id),
  category_id uuid not null references vehicle_categories(id),
  name text not null,
  slug text not null unique,
  body_type text,
  loader_size text check (loader_size is null or loader_size in ('Small', 'Medium', 'Large')),
  image_url text,
  overview text,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references vehicle_models(id),
  name text not null,
  slug text not null,
  ex_showroom_price numeric(12,2) not null,
  fuel_type text not null,
  transmission text not null,
  engine_capacity text,
  mileage text,
  seating_capacity integer,
  specifications jsonb not null default '{}'::jsonb,
  specification_groups jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  unique(model_id, slug)
);

create table if not exists vehicle_media (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references vehicle_models(id),
  variant_id uuid references vehicle_variants(id),
  color_name text,
  url text not null,
  alt text not null,
  media_type text not null default 'exterior',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists states (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id),
  name text not null,
  slug text not null unique,
  default_rto_id uuid
);

create table if not exists rto_offices (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id),
  city_id uuid not null references cities(id),
  code text not null,
  name text not null
);

create table if not exists state_tax_rules (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id),
  category_id uuid not null references vehicle_categories(id),
  fuel_type text,
  min_price numeric(12,2) not null default 0,
  max_price numeric(12,2),
  road_tax_percent numeric(5,2) not null default 0,
  fixed_tax_amount numeric(12,2) not null default 0,
  ev_exemption_percent numeric(5,2) not null default 0,
  luxury_cess_percent numeric(5,2) not null default 0,
  active boolean not null default true
);

create table if not exists rto_charges (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id),
  city_id uuid not null references cities(id),
  rto_id uuid references rto_offices(id),
  registration_fee numeric(12,2) not null default 0,
  smart_card_fee numeric(12,2) not null default 0,
  number_plate_fee numeric(12,2) not null default 0,
  hypothecation_fee numeric(12,2) not null default 0,
  fastag_fee numeric(12,2) not null default 0,
  handling_charges numeric(12,2) not null default 0,
  active boolean not null default true
);

create table if not exists insurance_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references vehicle_categories(id),
  fuel_type text,
  percent_of_ex_showroom numeric(5,2) not null default 0,
  fixed_amount numeric(12,2) not null default 0,
  active boolean not null default true
);

create table if not exists dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  city_id uuid not null references cities(id),
  area text,
  contact_person text,
  phone text,
  email text,
  gst_number text,
  active boolean not null default true,
  verified boolean not null default false,
  priority integer not null default 0
);

create table if not exists dealer_brand_mappings (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references dealers(id),
  brand_id uuid not null references brands(id),
  city_id uuid not null references cities(id),
  active boolean not null default true,
  unique(dealer_id, brand_id, city_id)
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  dealer_id uuid references dealers(id),
  brand_id uuid references brands(id),
  model_id uuid references vehicle_models(id),
  city_id uuid references cities(id),
  discount_amount numeric(12,2) not null default 0,
  sponsor_type text not null default 'dealer',
  placement text not null default 'dealer_card',
  active boolean not null default true
);

create table if not exists vehicle_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  city_id uuid not null references cities(id),
  brand_id uuid not null references brands(id),
  model_id uuid not null references vehicle_models(id),
  variant_id uuid not null references vehicle_variants(id),
  selected_onroad_price numeric(12,2) not null,
  preferred_contact_time text,
  message text,
  assigned_dealer_id uuid references dealers(id),
  status text not null default 'new',
  source text not null default 'pricing_page',
  created_at timestamptz not null default now()
);

create table if not exists seo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  page_kind text not null,
  title text not null,
  h1 text not null,
  meta_title text,
  meta_description text,
  intro text,
  body text,
  faq jsonb not null default '[]'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  show_on_homepage boolean not null default false,
  show_in_footer boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists hero_promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  category_key text not null,
  brand_id uuid references brands(id),
  model_id uuid references vehicle_models(id),
  variant_id uuid references vehicle_variants(id),
  target_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists comparison_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  city_id uuid not null references cities(id),
  vehicle_1_model_id uuid not null references vehicle_models(id),
  vehicle_1_variant_id uuid not null references vehicle_variants(id),
  vehicle_2_model_id uuid not null references vehicle_models(id),
  vehicle_2_variant_id uuid not null references vehicle_variants(id),
  vehicle_3_model_id uuid references vehicle_models(id),
  vehicle_3_variant_id uuid references vehicle_variants(id),
  meta_title text,
  meta_description text,
  intro text,
  verdict text,
  faq jsonb not null default '[]'::jsonb,
  show_on_homepage boolean not null default false,
  show_in_footer boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
