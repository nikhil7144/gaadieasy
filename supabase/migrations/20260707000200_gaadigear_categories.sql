create table if not exists gear_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references gear_categories(id),
  name text not null,
  slug text not null unique,
  level integer not null,
  applicable_vehicle_types uuid[] not null default '{}'::uuid[],
  sort_order integer not null default 0,
  is_active boolean not null default true
);

-- STEP 1: Level 1 categories
insert into gear_categories (name, slug, level, sort_order) values
  ('Parts', 'parts', 1, 1),
  ('Interior & Comfort', 'interior-comfort', 1, 2),
  ('Exterior & Styling', 'exterior-styling', 1, 3),
  ('Bike Accessories', 'bike-accessories', 1, 4),
  ('Riding Gear', 'riding-gear', 1, 5),
  ('Riding & Travel Accessories', 'riding-travel-accessories', 1, 6),
  ('Electronics & Charging', 'electronics-charging', 1, 7),
  ('Fleet & Compliance', 'fleet-compliance', 1, 8),
  ('Care & Maintenance', 'care-maintenance', 1, 9)
on conflict (slug) do nothing;

-- STEP 2: Level 2 categories, one insert block per parent slug

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Engine Parts', 'engine-parts', 1),
  ('Brake Parts', 'brake-parts', 2),
  ('Electricals & Battery', 'electricals-battery', 3),
  ('Suspension', 'suspension', 4),
  ('Filters & Fluids', 'filters-fluids', 5),
  ('Body Parts', 'body-parts', 6)
) as v(name, slug, sort_order)
where c.slug = 'parts'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Seat Covers', 'seat-covers', 1),
  ('Mats & Liners', 'mats-liners', 2),
  ('Air Fresheners & Perfumes', 'air-fresheners-perfumes', 3),
  ('Organizers & Storage', 'organizers-storage', 4),
  ('Sunshades', 'sunshades', 5)
) as v(name, slug, sort_order)
where c.slug = 'interior-comfort'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Body Wrap & Decals', 'body-wrap-decals', 1),
  ('Alloy Wheels & Covers', 'alloy-wheels-covers', 2),
  ('Mud Flaps & Guards', 'mud-flaps-guards', 3),
  ('Lighting (LED bars, fog lamps)', 'lighting-led-fog-lamps', 4)
) as v(name, slug, sort_order)
where c.slug = 'exterior-styling'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Crash Guards & Protection', 'crash-guards-protection', 1),
  ('Luggage & Touring', 'luggage-touring', 2),
  ('Windshields & Visors', 'windshields-visors', 3),
  ('Seats & Comfort', 'seats-comfort', 4),
  ('Styling & Cosmetic', 'styling-cosmetic', 5)
) as v(name, slug, sort_order)
where c.slug = 'bike-accessories'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Helmets', 'helmets', 1),
  ('Jackets', 'jackets', 2),
  ('Gloves', 'gloves', 3),
  ('Riding Pants', 'riding-pants', 4),
  ('Boots', 'boots', 5),
  ('Base Layers / Rain Gear', 'base-layers-rain-gear', 6)
) as v(name, slug, sort_order)
where c.slug = 'riding-gear'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Communication', 'communication', 1),
  ('Action Cameras & Mounts', 'action-cameras-mounts', 2),
  ('Tools & Emergency Kits', 'tools-emergency-kits', 3),
  ('Bags & Backpacks', 'bags-backpacks', 4)
) as v(name, slug, sort_order)
where c.slug = 'riding-travel-accessories'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Chargers & Cables', 'chargers-cables', 1),
  ('Dash Cams', 'dash-cams', 2),
  ('GPS & Mobile Mounts', 'gps-mobile-mounts', 3),
  ('Inverters & Power Banks', 'inverters-power-banks', 4)
) as v(name, slug, sort_order)
where c.slug = 'electronics-charging'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Reflective Tape & Safety Signage', 'reflective-tape-safety-signage', 1),
  ('Fire Extinguishers & First Aid', 'fire-extinguishers-first-aid', 2),
  ('GPS Fleet Trackers', 'gps-fleet-trackers', 3),
  ('Tarpaulins & Load Covers', 'tarpaulins-load-covers', 4)
) as v(name, slug, sort_order)
where c.slug = 'fleet-compliance'
on conflict (slug) do nothing;

insert into gear_categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from gear_categories c, (values
  ('Cleaning & Detailing', 'cleaning-detailing', 1),
  ('Covers (Body/Dust)', 'covers-body-dust', 2),
  ('Lubricants & Care Kits', 'lubricants-care-kits', 3)
) as v(name, slug, sort_order)
where c.slug = 'care-maintenance'
on conflict (slug) do nothing;

-- STEP 3: Tag each L1 category with applicable_vehicle_types (references the new
-- vehicle_types table added in 20260707000100, not the old vehicle_categories list).
-- Three Wheeler is left untagged everywhere for now -- passenger-ev-vehicles has no
-- live models yet; tag the relevant categories (Parts, Electronics & Charging,
-- Care & Maintenance) once that segment actually has listings.

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('two-wheeler', 'car', 'commercial-vehicle')
) where slug = 'parts';

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('car', 'commercial-vehicle')
) where slug = 'interior-comfort';

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('car', 'commercial-vehicle', 'two-wheeler')
) where slug = 'exterior-styling';

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug = 'two-wheeler'
) where slug in ('bike-accessories', 'riding-gear');

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('two-wheeler', 'car', 'commercial-vehicle')
) where slug in ('riding-travel-accessories', 'electronics-charging', 'care-maintenance');

update gear_categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug = 'commercial-vehicle'
) where slug = 'fleet-compliance';

notify pgrst, 'reload schema';
