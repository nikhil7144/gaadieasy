create table if not exists gear_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id),
  brand_id uuid references gear_brands(id),
  category_id uuid not null references gear_categories(id),
  title text not null,
  slug text not null unique,
  description text,
  mrp numeric(10,2) not null,
  selling_price numeric(10,2) not null,
  gst_rate numeric(4,2) not null default 18,
  hsn_code text,
  stock_qty integer not null default 0,
  sku text,
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  usage_tags text[] not null default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'live', 'rejected', 'paused')),
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gear_products_category_status on gear_products(category_id, status);
create index if not exists idx_gear_products_seller on gear_products(seller_id);

-- What a product fits. One product can have multiple rows (e.g. a charger that
-- fits "all Cars" AND "all Commercial Vehicles" gets two rows). vehicle_type_id
-- references the new vehicle_types table; vehicle_brand_id references the
-- existing `brands` table (spec called this table vehicle_brands -- live schema
-- names it `brands`).
create table if not exists gear_product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references gear_products(id) on delete cascade,

  compatibility_type text not null check (compatibility_type in
    ('global', 'vehicle_type', 'segment', 'brand', 'model', 'variant')),

  vehicle_type_id uuid references vehicle_types(id),
  segment text,
  vehicle_brand_id uuid references brands(id),
  vehicle_model_id uuid references vehicle_models(id),
  vehicle_variant_id uuid references vehicle_variants(id),

  specificity_level integer generated always as (
    case compatibility_type
      when 'global' then 0
      when 'vehicle_type' then 1
      when 'segment' then 2
      when 'brand' then 3
      when 'model' then 4
      when 'variant' then 5
    end
  ) stored
);

create index if not exists idx_gear_compat_model on gear_product_compatibility(vehicle_model_id);
create index if not exists idx_gear_compat_brand on gear_product_compatibility(vehicle_brand_id);
create index if not exists idx_gear_compat_type_vt on gear_product_compatibility(compatibility_type, vehicle_type_id);
create index if not exists idx_gear_compat_segment on gear_product_compatibility(vehicle_type_id, segment);

-- Size/color variants (riding gear etc.)
create table if not exists gear_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references gear_products(id) on delete cascade,
  size text,
  color text,
  additional_price numeric(10,2) not null default 0,
  stock_qty integer not null default 0,
  sku_suffix text
);

notify pgrst, 'reload schema';
