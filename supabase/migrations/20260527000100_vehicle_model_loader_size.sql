alter table if exists vehicle_models
add column if not exists loader_size text
check (loader_size is null or loader_size in ('Small', 'Medium', 'Large'));

notify pgrst, 'reload schema';
