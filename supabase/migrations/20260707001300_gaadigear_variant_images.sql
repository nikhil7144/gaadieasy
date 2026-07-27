-- Each size/color variant gets its own pair of images (e.g. front/back or
-- colorway shots) distinct from the product-level gallery.
alter table gear_product_variants add column if not exists images jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
