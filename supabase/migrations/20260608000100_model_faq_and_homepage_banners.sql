alter table if exists vehicle_models
add column if not exists faq jsonb not null default '[]'::jsonb;

alter table if exists hero_promotions
add column if not exists placement text not null default 'homepage_hero';

alter table if exists hero_promotions
add column if not exists eyebrow text;

alter table if exists hero_promotions
add column if not exists cta_label text;

notify pgrst, 'reload schema';
