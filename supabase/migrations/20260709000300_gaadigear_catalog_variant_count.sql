-- gear_catalog_index needs to know how many variants a product has, not just
-- its cheapest price -- buyer-facing cards show "N variants" alongside the
-- "Starting from" price, mirroring the vehicle card pattern (e.g. "21
-- variants" on a Tiago card).
alter table gear_catalog_index add column if not exists variant_count integer not null default 1;

notify pgrst, 'reload schema';
