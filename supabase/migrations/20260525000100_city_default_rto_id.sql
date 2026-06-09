alter table if exists cities
add column if not exists default_rto_id uuid;

notify pgrst, 'reload schema';
