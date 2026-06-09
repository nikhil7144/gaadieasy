alter table if exists vehicle_models
add column if not exists faq jsonb not null default '[]'::jsonb;

alter table if exists hero_promotions
add column if not exists placement text not null default 'homepage_hero';

alter table if exists hero_promotions
add column if not exists eyebrow text;

alter table if exists hero_promotions
add column if not exists cta_label text;

alter table if exists hero_promotions
add column if not exists headline text;

alter table if exists hero_promotions
add column if not exists supporting_copy text;

alter table if exists hero_promotions
add column if not exists stat_1_label text;

alter table if exists hero_promotions
add column if not exists stat_1_value text;

alter table if exists hero_promotions
add column if not exists stat_2_label text;

alter table if exists hero_promotions
add column if not exists stat_2_value text;

alter table if exists hero_promotions
add column if not exists stat_3_label text;

alter table if exists hero_promotions
add column if not exists stat_3_value text;

notify pgrst, 'reload schema';
