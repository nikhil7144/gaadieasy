alter table if exists vehicle_models
add column if not exists launch_label text;

notify pgrst, 'reload schema';
