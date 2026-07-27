-- Collections & Homepage Merchandising (GAADIGEAR_SPEC.md §12). No pg_cron
-- anywhere in this codebase -- dynamic collections are recomputed via the same
-- admin-triggered app-level rebuild pattern already used for gear_catalog_index
-- / gear_model_cache (lib/services/gear-collections-cache), not a scheduled job.

alter table gear_categories add column if not exists image_url text;

create table if not exists gear_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  type text not null default 'manual', -- 'manual' | 'dynamic' | 'brand' | 'category' | 'vehicle'
  display_style text not null default 'carousel', -- 'carousel' | 'grid' | 'banner' | 'hero' | 'featured'
  banner_image text,
  icon text,
  priority integer not null default 0,
  is_active boolean not null default true,
  max_products integer not null default 12,
  conditions jsonb not null default '{}'::jsonb,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Manual (and brand/category, which are hand-tagged the same way for now)
-- collections only -- the admin-chosen, ordered product list.
create table if not exists gear_collection_products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references gear_collections(id) on delete cascade,
  product_id uuid not null references gear_products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, product_id)
);

-- The cache. Homepage/collection pages never evaluate conditions or read
-- gear_collection_products live -- only this table.
create table if not exists gear_collection_products_cache (
  collection_id uuid primary key references gear_collections(id) on delete cascade,
  product_cards jsonb not null default '[]'::jsonb,
  product_count integer not null default 0,
  refreshed_at timestamptz not null default now()
);

create table if not exists gear_homepage_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  collection_id uuid references gear_collections(id) on delete cascade,
  display_style text, -- overrides the collection's own display_style if set
  sort_order integer not null default 0,
  is_active boolean not null default true
);

notify pgrst, 'reload schema';
