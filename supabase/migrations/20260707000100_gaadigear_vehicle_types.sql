create table if not exists vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into vehicle_types (name, slug) values
  ('Car', 'car'),
  ('Two Wheeler', 'two-wheeler'),
  ('Commercial Vehicle', 'commercial-vehicle'),
  ('Three Wheeler', 'three-wheeler')
on conflict (slug) do nothing;

alter table if exists vehicle_categories
add column if not exists vehicle_type_id uuid references vehicle_types(id);

-- Category -> vehicle_type mapping confirmed against live data (115 vehicle_models,
-- 7 vehicle_categories). EV-ness for cars/bikes/scooters lives on vehicle_variants.fuel_type,
-- not as a separate category, so this is a clean per-category mapping, not per-model.
update vehicle_categories set vehicle_type_id = (select id from vehicle_types where slug = 'car')
where slug = 'cars';

update vehicle_categories set vehicle_type_id = (select id from vehicle_types where slug = 'two-wheeler')
where slug in ('bikes', 'scooters');

update vehicle_categories set vehicle_type_id = (select id from vehicle_types where slug = 'commercial-vehicle')
where slug in ('commercial-vehicles', 'ev-commercial-vehicles');

update vehicle_categories set vehicle_type_id = (select id from vehicle_types where slug = 'three-wheeler')
where slug = 'passenger-ev-vehicles';

-- 'ev-vehicles' category is orphaned: already migrated away in the live DB (0 models
-- reference it). Mark inactive rather than delete, and leave vehicle_type_id null.
update vehicle_categories set active = false where slug = 'ev-vehicles';

notify pgrst, 'reload schema';
