-- display_style is consumed ONLY by the homepage renderer -- the standalone
-- collection landing page (/gaadigear/collections/[slug]) always renders a
-- plain grid regardless of it. Keeping a copy on gear_collections was dead
-- weight (and confusing in the admin UI, since it looked like a real choice
-- that might never matter). Moving it to live solely on
-- gear_homepage_sections, the only place it's ever read.

update gear_homepage_sections set display_style = 'carousel' where display_style is null;
alter table gear_homepage_sections alter column display_style set default 'carousel';
alter table gear_homepage_sections alter column display_style set not null;

alter table gear_collections drop column if exists display_style;

notify pgrst, 'reload schema';
