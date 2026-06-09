insert into vehicle_categories (id, name, slug, description, active)
values (
  '00000000-0000-4000-8000-000000000007',
  'Passenger EV Vehicles',
  'passenger-ev-vehicles',
  'Electric rickshaws, e-autos and passenger electric mobility vehicles.',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

notify pgrst, 'reload schema';
