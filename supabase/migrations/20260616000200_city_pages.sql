create table if not exists city_pages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  slug text not null unique,
  title text not null,
  h1 text not null,
  meta_title text not null,
  meta_description text not null,
  intro text not null default '',
  body text not null default '',
  hero_image_url text,
  featured_category_id uuid references vehicle_categories(id) on delete set null,
  featured_brand_ids uuid[] not null default '{}'::uuid[],
  faq jsonb not null default '[]'::jsonb,
  show_in_footer boolean not null default true,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_pages_city_id_idx on city_pages(city_id);
create index if not exists city_pages_active_idx on city_pages(active);
create index if not exists city_pages_footer_idx on city_pages(show_in_footer, display_order);

insert into city_pages (
  city_id,
  slug,
  title,
  h1,
  meta_title,
  meta_description,
  intro,
  body,
  featured_category_id,
  featured_brand_ids,
  faq,
  show_in_footer,
  display_order,
  active
)
select
  c.id,
  'bangalore',
  'Vehicle on-road prices in Bengaluru',
  'On-road prices in Bengaluru',
  'Vehicle On-Road Prices in Bengaluru | Gaadieasy',
  'Compare cars, bikes, scooters, EVs and commercial vehicle on-road prices in Bengaluru with RTO, insurance, dealer offers and brand-wise models.',
  'Explore city-wise vehicle prices in Bengaluru with live model data, RTO context, dealer availability and transparent pricing sections.',
  'Bengaluru vehicle prices can vary by state tax, RTO office, insurance plan, dealer offer and selected variant. Use this page to shortlist brands and models before opening the detailed on-road price page.',
  vc.id,
  array_remove(array[b1.id, b2.id, b3.id], null),
  '[{"question":"Are prices on this city page final dealer quotes?","answer":"No. The city page shows planning estimates from the pricing engine. Dealer quote, insurance plan and selected accessories can change the final price."}]'::jsonb,
  true,
  1,
  true
from cities c
left join vehicle_categories vc on vc.slug = 'cars'
left join brands b1 on b1.slug = 'hyundai'
left join brands b2 on b2.slug = 'tata'
left join brands b3 on b3.slug = 'ather'
where c.slug = 'bangalore'
on conflict (slug) do nothing;

insert into city_pages (
  city_id,
  slug,
  title,
  h1,
  meta_title,
  meta_description,
  intro,
  body,
  featured_category_id,
  featured_brand_ids,
  faq,
  show_in_footer,
  display_order,
  active
)
select
  c.id,
  'mumbai',
  'Vehicle on-road prices in Mumbai',
  'On-road prices in Mumbai',
  'Vehicle On-Road Prices in Mumbai | Gaadieasy',
  'Check Mumbai on-road prices for popular vehicle models with Maharashtra tax, RTO charges, insurance estimate and dealer offers.',
  'Shortlist vehicles in Mumbai with brand-wise models, city price estimates and dealer-led discovery.',
  'Mumbai on-road price estimates include ex-showroom price, state-level tax, RTO charges and insurance assumptions where configured.',
  vc.id,
  array_remove(array[b1.id, b2.id, b3.id], null),
  '[{"question":"Why does Mumbai price differ from Delhi or Bengaluru?","answer":"Road tax, RTO charges, insurance and dealer offers are configured city or state-wise, so final estimates change by location."}]'::jsonb,
  true,
  2,
  true
from cities c
left join vehicle_categories vc on vc.slug = 'cars'
left join brands b1 on b1.slug = 'tata'
left join brands b2 on b2.slug = 'mahindra'
left join brands b3 on b3.slug = 'hyundai'
where c.slug = 'mumbai'
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
