-- Add is_upcoming flag to vehicle_models
alter table vehicle_models add column if not exists is_upcoming boolean not null default false;

-- Vehicle stories (the main editorial/launch page per model)
create table if not exists vehicle_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand_slug text not null,
  brand_name text not null,
  model_id uuid references vehicle_models(id) on delete set null,
  title text not null,
  tagline text,
  hero_image_url text,
  intro text not null default '',
  body text not null default '',
  launch_status text not null default 'upcoming' check (launch_status in ('upcoming', 'launched', 'updated', 'discontinued')),
  expected_launch_date date,
  actual_launch_date date,
  seo_title text,
  seo_description text,
  featured boolean not null default false,
  published_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updates posted by admin under a story (timeline feed)
create table if not exists vehicle_story_updates (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references vehicle_stories(id) on delete cascade,
  title text not null,
  body text not null default '',
  image_url text,
  posted_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Media gallery images for a story
create table if not exists vehicle_story_media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references vehicle_stories(id) on delete cascade,
  url text not null,
  alt text not null default '',
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_stories_brand_slug_idx on vehicle_stories(brand_slug);
create index if not exists vehicle_stories_model_id_idx on vehicle_stories(model_id);
create index if not exists vehicle_story_updates_story_id_idx on vehicle_story_updates(story_id);
create index if not exists vehicle_story_media_story_id_idx on vehicle_story_media(story_id);
