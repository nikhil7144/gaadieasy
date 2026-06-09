alter table if exists brands
add column if not exists category_ids uuid[] not null default '{}'::uuid[];

notify pgrst, 'reload schema';
