-- Cart persistence, decided 2026-07-07 (see GAADIGEAR_PLAN.md). Buyers are
-- optional-account: guest carts are identified by cart_token (an httpOnly
-- cookie), logged-in buyers by buyer_id. A guest cart's buyer_id gets
-- backfilled on login/signup (merge logic lives in application code, not a
-- DB trigger -- see lib/services/gear-cart).
create table if not exists gear_carts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id),
  cart_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gear_carts_buyer on gear_carts(buyer_id);

create table if not exists gear_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references gear_carts(id) on delete cascade,
  product_id uuid not null references gear_products(id),
  variant_id uuid references gear_product_variants(id),
  qty integer not null default 1 check (qty > 0),
  added_at timestamptz not null default now(),
  unique(cart_id, product_id, variant_id)
);

notify pgrst, 'reload schema';
