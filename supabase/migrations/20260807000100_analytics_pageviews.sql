-- First-party pageview/journey tracking (UTM attribution + session path),
-- captured by components/shared/SiteAnalytics.tsx via /api/analytics/pageview.
-- No RLS -- same app-level-trust pattern as the rest of this codebase; only
-- the service-role client (server-side) ever writes or reads this table.
create table analytics_pageviews (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz not null default now()
);

-- Reconstructing one session's ordered journey ("session_id, order by
-- created_at") is the core query this table exists for.
create index analytics_pageviews_session_idx on analytics_pageviews (session_id, created_at);
-- Campaign rollups (admin dashboard summary) and general recency scans.
create index analytics_pageviews_campaign_idx on analytics_pageviews (utm_campaign, created_at) where utm_campaign is not null;
create index analytics_pageviews_created_idx on analytics_pageviews (created_at desc);

notify pgrst, 'reload schema';
