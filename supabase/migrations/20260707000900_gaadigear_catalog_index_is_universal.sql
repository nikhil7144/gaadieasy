-- Explicit marker for "this product has a global compatibility row", so
-- buyer-facing filter queries can treat it as a wildcard match for vehicle
-- type / brand / model / segment filters without having to special-case
-- specificity_level (which can be misleading if a product has both a global
-- row and a more specific row).
alter table if exists gear_catalog_index
add column if not exists is_universal boolean not null default false;

notify pgrst, 'reload schema';
