alter table if exists gear_products
add column if not exists rejection_reason text;

notify pgrst, 'reload schema';
