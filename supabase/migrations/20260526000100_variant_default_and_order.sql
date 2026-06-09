alter table if exists vehicle_variants
add column if not exists is_default boolean not null default false,
add column if not exists display_order integer not null default 0;

create unique index if not exists vehicle_variants_one_default_per_model
on vehicle_variants (model_id)
where is_default = true;

notify pgrst, 'reload schema';
