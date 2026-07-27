-- Read-optimized flat index for GaadiGear PLP/search/filters. Rebuilt by
-- application code (lib/services/gear-catalog-cache) on product create/update/
-- approve/delete, and via a manual admin "rebuild" action for full backfills --
-- mirrors vehicle_pricing_cache's refresh pattern, but (unlike that table) gets
-- a tracked migration.
create table if not exists gear_catalog_index (
  product_id uuid primary key references gear_products(id) on delete cascade,
  title text,
  slug text,
  category_l1 text,
  category_l2 text,
  brand_name text,
  seller_name text,
  price numeric(10,2),
  mrp numeric(10,2),
  rating_avg numeric(3,2),
  thumbnail_url text,
  usage_tags text[] not null default '{}'::text[],

  compatible_vehicle_type_ids uuid[] not null default '{}'::uuid[],
  compatible_segments text[] not null default '{}'::text[],
  compatible_brand_ids uuid[] not null default '{}'::uuid[],
  compatible_model_ids uuid[] not null default '{}'::uuid[],
  compatible_variant_ids uuid[] not null default '{}'::uuid[],
  compatibility_max_specificity integer not null default 0,

  status text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_vtype_gin on gear_catalog_index using gin(compatible_vehicle_type_ids);
create index if not exists idx_catalog_segment_gin on gear_catalog_index using gin(compatible_segments);
create index if not exists idx_catalog_model_gin on gear_catalog_index using gin(compatible_model_ids);
create index if not exists idx_catalog_brand_gin on gear_catalog_index using gin(compatible_brand_ids);
create index if not exists idx_catalog_search on gear_catalog_index using gin(to_tsvector('english', coalesce(title, '')));

-- Per-vehicle-model precomputed "Recommended Gear" widget -- one row, ready to
-- render, no joins at request time.
create table if not exists gear_model_cache (
  vehicle_model_id uuid primary key references vehicle_models(id) on delete cascade,
  top_products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
