-- Storefront profile fields -- logo_url and contact_email already existed on
-- sellers but were never actually surfaced in any seller-facing edit UI or
-- public storefront display. Adding the two still-missing fields here so the
-- whole "logo, banner, about, contact" set can be edited and shown together.
alter table sellers add column if not exists banner_url text;
alter table sellers add column if not exists about text;

notify pgrst, 'reload schema';
