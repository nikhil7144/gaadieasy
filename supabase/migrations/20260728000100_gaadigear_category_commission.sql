-- Per-category commission rate, applied to a product's unit price above the
-- flat-fee threshold (see lib/services/gear-checkout/index.ts). Defaults to
-- 7% for every existing category; admin-editable per category from there on
-- so specific categories can be tuned down later without a code change.
alter table gear_categories add column if not exists commission_pct numeric not null default 7;

notify pgrst, 'reload schema';
