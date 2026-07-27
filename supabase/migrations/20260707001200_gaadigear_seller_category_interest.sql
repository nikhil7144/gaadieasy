-- "What will you sell" (spec step 3) -- non-binding (doesn't gate anything),
-- but the spec still wants it persisted to help admin prioritize review.
alter table if exists sellers
add column if not exists interested_category_ids uuid[] not null default '{}'::uuid[];

notify pgrst, 'reload schema';
