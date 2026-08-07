import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AnalyticsCampaignSummary, AnalyticsPageview, AnalyticsSession } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function optStr(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function mapPageview(row: DbRow): AnalyticsPageview {
  return {
    id: String(row.id),
    visitorId: String(row.visitor_id),
    sessionId: String(row.session_id),
    path: String(row.path),
    referrer: optStr(row.referrer),
    utmSource: optStr(row.utm_source),
    utmMedium: optStr(row.utm_medium),
    utmCampaign: optStr(row.utm_campaign),
    utmContent: optStr(row.utm_content),
    utmTerm: optStr(row.utm_term),
    createdAt: String(row.created_at),
  };
}

export async function logPageview(input: {
  visitorId: string;
  sessionId: string;
  path: string;
  referrer?: string;
  utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string };
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("analytics_pageviews").insert({
    visitor_id: input.visitorId,
    session_id: input.sessionId,
    path: input.path,
    referrer: input.referrer ?? null,
    utm_source: input.utm?.utm_source ?? null,
    utm_medium: input.utm?.utm_medium ?? null,
    utm_campaign: input.utm?.utm_campaign ?? null,
    utm_content: input.utm?.utm_content ?? null,
    utm_term: input.utm?.utm_term ?? null,
  });
}

// Sessions are derived in JS from a bounded, recent row window rather than a
// SQL view/RPC -- this is an admin-only reporting screen, not a hot path, and
// matches this codebase's existing preference for app-level aggregation over
// database views on low-volume admin data.
async function fetchRecentRows(limit: number): Promise<DbRow[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analytics_pageviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbRow[];
}

function buildSessions(rows: DbRow[]): AnalyticsSession[] {
  const bySession = new Map<string, DbRow[]>();
  for (const row of rows) {
    const key = String(row.session_id);
    const group = bySession.get(key);
    if (group) group.push(row);
    else bySession.set(key, [row]);
  }

  const sessions: AnalyticsSession[] = [];
  for (const [sessionId, sessionRows] of bySession) {
    const sorted = [...sessionRows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    sessions.push({
      sessionId,
      visitorId: String(first.visitor_id),
      utmSource: optStr(first.utm_source),
      utmMedium: optStr(first.utm_medium),
      utmCampaign: optStr(first.utm_campaign),
      landingPath: String(first.path),
      pageCount: sorted.length,
      startedAt: String(first.created_at),
      lastSeenAt: String(last.created_at),
    });
  }
  return sessions.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export async function getRecentSessions(limit = 100): Promise<AnalyticsSession[]> {
  const rows = await fetchRecentRows(5000);
  return buildSessions(rows).slice(0, limit);
}

export async function getCampaignSummary(): Promise<AnalyticsCampaignSummary[]> {
  const rows = await fetchRecentRows(5000);
  const sessions = buildSessions(rows).filter((s) => s.utmCampaign);

  const groups = new Map<string, { utmSource: string; utmCampaign: string; sessions: AnalyticsSession[] }>();
  for (const session of sessions) {
    const key = `${session.utmSource ?? "(unknown)"}|||${session.utmCampaign}`;
    const group = groups.get(key) ?? { utmSource: session.utmSource ?? "(unknown)", utmCampaign: session.utmCampaign!, sessions: [] };
    group.sessions.push(session);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const landingCounts = new Map<string, number>();
      let pageviewCount = 0;
      for (const session of group.sessions) {
        landingCounts.set(session.landingPath, (landingCounts.get(session.landingPath) ?? 0) + 1);
        pageviewCount += session.pageCount;
      }
      const topLandingPath = [...landingCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        utmSource: group.utmSource,
        utmCampaign: group.utmCampaign,
        sessionCount: group.sessions.length,
        pageviewCount,
        topLandingPath,
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount);
}

export async function getSessionJourney(sessionId: string): Promise<AnalyticsPageview[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analytics_pageviews")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbRow[]).map(mapPageview);
}
