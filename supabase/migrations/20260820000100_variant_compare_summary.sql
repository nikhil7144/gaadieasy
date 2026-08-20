-- Browse/listing surfaces (homepage discovery, /brands/*, compare modal) previously had
-- to receive the whole `specifications` JSON blob (~1.2 KB/row, 0.86 MB across the table)
-- purely to render four compare rows, highlights/features, and the commercial strings
-- that feed discovery's search index.
--
-- compare_summary precomputes exactly those values (~200 B/row) so `specifications`
-- never leaves the server for a browse query. It is derived data: the source of truth
-- stays `specifications`, and deriveCompareSummary() in lib/services/variant-summary.ts
-- regenerates it on every variant create/update.
alter table vehicle_variants
  add column if not exists compare_summary jsonb not null default '{}'::jsonb;

comment on column vehicle_variants.compare_summary is
  'Derived from specifications by deriveCompareSummary(). Do not hand-edit — it is overwritten on every variant write. Backfill: node scripts/backfill-compare-summary.mjs';

notify pgrst, 'reload schema';
