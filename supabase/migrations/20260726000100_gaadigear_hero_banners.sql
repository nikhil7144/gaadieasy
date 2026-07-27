-- Admin-editable homepage hero banner (GAADIGEAR_SPEC.md §13.1). Supports
-- more than one row so this can become a rotating hero later without another
-- migration, but the homepage only ever reads the single active one with the
-- lowest sort_order for now.
create table if not exists gear_hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  cta_label text not null default 'Shop now',
  cta_href text not null default '/gaadigear/products',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
