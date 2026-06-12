alter table if exists cities
add column if not exists tier text;

alter table if exists cities
add column if not exists is_metro boolean not null default false;

alter table if exists cities
add column if not exists rto_state_code text;

create table if not exists gst_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_class text not null unique,
  gst_percent numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists registration_fee_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_class text not null unique,
  registration_fee numeric(12,2) not null default 0,
  smart_card_fee numeric(12,2) not null default 0,
  number_plate_fee numeric(12,2) not null default 0,
  hypothecation_fee numeric(12,2) not null default 0,
  fastag_fee numeric(12,2) not null default 0,
  handling_charges numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into states (name, code)
values
  ('Maharashtra', 'MH'),
  ('Delhi', 'DL'),
  ('Uttar Pradesh', 'UP'),
  ('Haryana', 'HR'),
  ('Karnataka', 'KA'),
  ('Tamil Nadu', 'TN'),
  ('Telangana', 'TS'),
  ('West Bengal', 'WB'),
  ('Gujarat', 'GJ'),
  ('Rajasthan', 'RJ'),
  ('Bihar', 'BR'),
  ('Jharkhand', 'JH'),
  ('Odisha', 'OD'),
  ('Chandigarh', 'CH'),
  ('Madhya Pradesh', 'MP'),
  ('Kerala', 'KL')
on conflict (code) do update
set name = excluded.name;

with city_seed(state_code, city_name, slug, tier, is_metro, rto_state_code) as (
  values
    ('MH', 'Mumbai', 'mumbai', 'Metro', true, 'MH'),
    ('MH', 'Pune', 'pune', 'Metro', true, 'MH'),
    ('MH', 'Nagpur', 'nagpur', 'Tier 1', false, 'MH'),
    ('MH', 'Nashik', 'nashik', 'Tier 1', false, 'MH'),
    ('MH', 'Thane', 'thane', 'Tier 1', false, 'MH'),
    ('DL', 'New Delhi', 'new-delhi', 'Metro', true, 'DL'),
    ('DL', 'Delhi', 'delhi', 'Metro', true, 'DL'),
    ('UP', 'Noida', 'noida', 'Metro', true, 'UP'),
    ('UP', 'Ghaziabad', 'ghaziabad', 'Tier 1', false, 'UP'),
    ('HR', 'Gurugram', 'gurugram', 'Metro', true, 'HR'),
    ('HR', 'Faridabad', 'faridabad', 'Tier 1', false, 'HR'),
    ('KA', 'Bengaluru', 'bangalore', 'Metro', true, 'KA'),
    ('KA', 'Mysuru', 'mysuru', 'Tier 1', false, 'KA'),
    ('KA', 'Hubballi-Dharwad', 'hubballi-dharwad', 'Tier 1', false, 'KA'),
    ('KA', 'Mangaluru', 'mangaluru', 'Tier 1', false, 'KA'),
    ('TN', 'Chennai', 'chennai', 'Metro', true, 'TN'),
    ('TN', 'Coimbatore', 'coimbatore', 'Tier 1', false, 'TN'),
    ('TN', 'Madurai', 'madurai', 'Tier 1', false, 'TN'),
    ('TN', 'Tiruchirappalli', 'tiruchirappalli', 'Tier 1', false, 'TN'),
    ('TN', 'Salem', 'salem', 'Tier 1', false, 'TN'),
    ('TS', 'Hyderabad', 'hyderabad', 'Metro', true, 'TS'),
    ('TS', 'Warangal', 'warangal', 'Tier 1', false, 'TS'),
    ('TS', 'Karimnagar', 'karimnagar', 'Tier 1', false, 'TS'),
    ('WB', 'Kolkata', 'kolkata', 'Metro', true, 'WB'),
    ('WB', 'Howrah', 'howrah', 'Tier 1', false, 'WB'),
    ('WB', 'Durgapur', 'durgapur', 'Tier 1', false, 'WB'),
    ('WB', 'Siliguri', 'siliguri', 'Tier 1', false, 'WB'),
    ('GJ', 'Ahmedabad', 'ahmedabad', 'Metro', true, 'GJ'),
    ('GJ', 'Surat', 'surat', 'Tier 1', false, 'GJ'),
    ('GJ', 'Vadodara', 'vadodara', 'Tier 1', false, 'GJ'),
    ('GJ', 'Rajkot', 'rajkot', 'Tier 1', false, 'GJ'),
    ('GJ', 'Gandhinagar', 'gandhinagar', 'Tier 1', false, 'GJ'),
    ('RJ', 'Jaipur', 'jaipur', 'Tier 1', false, 'RJ'),
    ('RJ', 'Jodhpur', 'jodhpur', 'Tier 1', false, 'RJ'),
    ('RJ', 'Udaipur', 'udaipur', 'Tier 1', false, 'RJ'),
    ('RJ', 'Kota', 'kota', 'Tier 1', false, 'RJ'),
    ('UP', 'Lucknow', 'lucknow', 'Tier 1', false, 'UP'),
    ('UP', 'Kanpur', 'kanpur', 'Tier 1', false, 'UP'),
    ('UP', 'Agra', 'agra', 'Tier 1', false, 'UP'),
    ('UP', 'Varanasi', 'varanasi', 'Tier 1', false, 'UP'),
    ('UP', 'Prayagraj', 'prayagraj', 'Tier 1', false, 'UP'),
    ('BR', 'Patna', 'patna', 'Tier 1', false, 'BR'),
    ('JH', 'Ranchi', 'ranchi', 'Tier 1', false, 'JH'),
    ('OD', 'Bhubaneswar', 'bhubaneswar', 'Tier 1', false, 'OD'),
    ('OD', 'Cuttack', 'cuttack', 'Tier 1', false, 'OD'),
    ('CH', 'Chandigarh', 'chandigarh', 'Tier 1', false, 'CH'),
    ('MP', 'Bhopal', 'bhopal', 'Tier 1', false, 'MP'),
    ('MP', 'Indore', 'indore', 'Tier 1', false, 'MP'),
    ('KL', 'Kochi', 'kochi', 'Tier 1', false, 'KL'),
    ('KL', 'Thiruvananthapuram', 'thiruvananthapuram', 'Tier 1', false, 'KL')
)
insert into cities (state_id, name, slug, tier, is_metro, rto_state_code)
select s.id, city_seed.city_name, city_seed.slug, city_seed.tier, city_seed.is_metro, city_seed.rto_state_code
from city_seed
join states s on s.code = city_seed.state_code
on conflict (slug) do update
set
  state_id = excluded.state_id,
  name = excluded.name,
  tier = excluded.tier,
  is_metro = excluded.is_metro,
  rto_state_code = excluded.rto_state_code;

with office_seed(slug, code, office_name) as (
  values
    ('mumbai', 'MH-01', 'Mumbai RTO'),
    ('pune', 'MH-12', 'Pune RTO'),
    ('nagpur', 'MH-31', 'Nagpur RTO'),
    ('nashik', 'MH-15', 'Nashik RTO'),
    ('thane', 'MH-04', 'Thane RTO'),
    ('new-delhi', 'DL-01', 'New Delhi RTO'),
    ('delhi', 'DL-01', 'Delhi North RTO'),
    ('noida', 'UP-16', 'Noida RTO'),
    ('ghaziabad', 'UP-14', 'Ghaziabad RTO'),
    ('gurugram', 'HR-26', 'Gurugram RTO'),
    ('faridabad', 'HR-51', 'Faridabad RTO'),
    ('bangalore', 'KA-03', 'Bengaluru East RTO'),
    ('mysuru', 'KA-09', 'Mysuru RTO'),
    ('hubballi-dharwad', 'KA-25', 'Hubballi-Dharwad RTO'),
    ('mangaluru', 'KA-19', 'Mangaluru RTO'),
    ('chennai', 'TN-01', 'Chennai RTO'),
    ('coimbatore', 'TN-37', 'Coimbatore RTO'),
    ('madurai', 'TN-58', 'Madurai RTO'),
    ('tiruchirappalli', 'TN-45', 'Tiruchirappalli RTO'),
    ('salem', 'TN-27', 'Salem RTO'),
    ('hyderabad', 'TS-09', 'Hyderabad RTO'),
    ('warangal', 'TS-03', 'Warangal RTO'),
    ('karimnagar', 'TS-02', 'Karimnagar RTO'),
    ('kolkata', 'WB-01', 'Kolkata RTO'),
    ('howrah', 'WB-12', 'Howrah RTO'),
    ('durgapur', 'WB-39', 'Durgapur RTO'),
    ('siliguri', 'WB-73', 'Siliguri RTO'),
    ('ahmedabad', 'GJ-01', 'Ahmedabad RTO'),
    ('surat', 'GJ-05', 'Surat RTO'),
    ('vadodara', 'GJ-06', 'Vadodara RTO'),
    ('rajkot', 'GJ-03', 'Rajkot RTO'),
    ('gandhinagar', 'GJ-18', 'Gandhinagar RTO'),
    ('jaipur', 'RJ-14', 'Jaipur RTO'),
    ('jodhpur', 'RJ-19', 'Jodhpur RTO'),
    ('udaipur', 'RJ-27', 'Udaipur RTO'),
    ('kota', 'RJ-20', 'Kota RTO'),
    ('lucknow', 'UP-32', 'Lucknow RTO'),
    ('kanpur', 'UP-78', 'Kanpur RTO'),
    ('agra', 'UP-80', 'Agra RTO'),
    ('varanasi', 'UP-65', 'Varanasi RTO'),
    ('prayagraj', 'UP-70', 'Prayagraj RTO'),
    ('patna', 'BR-01', 'Patna RTO'),
    ('ranchi', 'JH-01', 'Ranchi RTO'),
    ('bhubaneswar', 'OD-02', 'Bhubaneswar RTO'),
    ('cuttack', 'OD-05', 'Cuttack RTO'),
    ('chandigarh', 'CH-01', 'Chandigarh RTO'),
    ('bhopal', 'MP-04', 'Bhopal RTO'),
    ('indore', 'MP-09', 'Indore RTO'),
    ('kochi', 'KL-07', 'Kochi RTO'),
    ('thiruvananthapuram', 'KL-01', 'Thiruvananthapuram RTO')
)
insert into rto_offices (state_id, city_id, code, name)
select c.state_id, c.id, office_seed.code, office_seed.office_name
from office_seed
join cities c on c.slug = office_seed.slug
where not exists (
  select 1 from rto_offices r where r.city_id = c.id and r.code = office_seed.code
);

update cities c
set default_rto_id = r.id
from rto_offices r
where r.city_id = c.id
  and c.default_rto_id is null;

insert into gst_rules (vehicle_class, gst_percent, active)
values
  ('car', 28, true),
  ('bike', 28, true),
  ('scooter', 28, true),
  ('ev_two_wheeler', 5, true),
  ('commercial_loading', 28, true),
  ('commercial_passenger', 28, true),
  ('ev_commercial_loading', 5, true),
  ('ev_commercial_passenger', 5, true),
  ('passenger_ev', 5, true),
  ('loading_ev', 5, true)
on conflict (vehicle_class) do update
set gst_percent = excluded.gst_percent,
    active = excluded.active;

insert into registration_fee_rules (
  vehicle_class,
  registration_fee,
  smart_card_fee,
  number_plate_fee,
  hypothecation_fee,
  fastag_fee,
  handling_charges,
  active
)
values
  ('car', 600, 200, 1200, 1500, 600, 0, true),
  ('bike', 300, 200, 500, 1500, 0, 0, true),
  ('scooter', 300, 200, 500, 1500, 0, 0, true),
  ('ev_two_wheeler', 300, 200, 500, 1500, 0, 0, true),
  ('commercial_loading', 1000, 300, 1200, 1500, 600, 0, true),
  ('commercial_passenger', 1000, 300, 1200, 1500, 600, 0, true),
  ('ev_commercial_loading', 1000, 300, 1200, 1500, 0, 0, true),
  ('ev_commercial_passenger', 1000, 300, 1200, 1500, 0, 0, true),
  ('passenger_ev', 1000, 300, 1200, 1500, 0, 0, true),
  ('loading_ev', 1000, 300, 1200, 1500, 0, 0, true)
on conflict (vehicle_class) do update
set
  registration_fee = excluded.registration_fee,
  smart_card_fee = excluded.smart_card_fee,
  number_plate_fee = excluded.number_plate_fee,
  hypothecation_fee = excluded.hypothecation_fee,
  fastag_fee = excluded.fastag_fee,
  handling_charges = excluded.handling_charges,
  active = excluded.active;

notify pgrst, 'reload schema';
