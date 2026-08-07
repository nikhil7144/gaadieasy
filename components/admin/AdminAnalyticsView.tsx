"use client";

import { useState } from "react";
import { adminFieldClass } from "@/components/admin/admin-form-utils";
import type { AnalyticsCampaignSummary, AnalyticsPageview, AnalyticsSession } from "@/types/automobile";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminAnalyticsView({
  campaigns,
  sessions,
}: {
  campaigns: AnalyticsCampaignSummary[];
  sessions: AnalyticsSession[];
}) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Record<string, AnalyticsPageview[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredSessions = sessions.filter((s) =>
    search.trim()
      ? s.landingPath.toLowerCase().includes(search.trim().toLowerCase()) ||
        (s.utmCampaign ?? "").toLowerCase().includes(search.trim().toLowerCase()) ||
        (s.utmSource ?? "").toLowerCase().includes(search.trim().toLowerCase())
      : true,
  );

  async function toggleSession(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (journeys[sessionId]) return;

    setLoadingId(sessionId);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics/session?id=${encodeURIComponent(sessionId)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setJourneys((prev) => ({ ...prev, [sessionId]: payload.pageviews }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load session journey");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-black text-slate-950">Traffic &amp; campaign analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          First-party pageview tracking captured on every public page (excluding admin/seller/dealer panels).
        </p>
      </div>

      <div>
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No UTM-tagged traffic recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Campaign</th>
                  <th className="px-3 py-2">Sessions</th>
                  <th className="px-3 py-2">Pageviews</th>
                  <th className="px-3 py-2">Top landing page</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr className="border-t border-slate-100" key={`${c.utmSource}|${c.utmCampaign}`}>
                    <td className="px-3 py-2 font-bold text-slate-800">{c.utmSource}</td>
                    <td className="px-3 py-2 text-slate-700">{c.utmCampaign}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{c.sessionCount}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{c.pageviewCount}</td>
                    <td className="px-3 py-2 truncate text-slate-500">{c.topLandingPath}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Recent sessions</h2>
          <input
            className={`${adminFieldClass} w-64`}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search landing page, campaign, source"
            value={search}
          />
        </div>

        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}

        {filteredSessions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No sessions match this filter.</p>
        ) : (
          <div className="mt-3">
            {filteredSessions.map((s) => (
              <div className="border-b border-slate-200 py-2 text-sm" key={s.sessionId}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-slate-950">{s.landingPath}</div>
                    <div className="truncate text-xs text-slate-500">
                      {s.utmSource ? `${s.utmSource}${s.utmCampaign ? ` · ${s.utmCampaign}` : ""}` : "Direct / no UTM"}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-slate-500">{s.pageCount} pages</div>
                  <div className="w-40 text-xs text-slate-500">{formatDateTime(s.startedAt)}</div>
                  <button
                    className="text-xs font-bold text-emerald-700 hover:underline"
                    onClick={() => toggleSession(s.sessionId)}
                    type="button"
                  >
                    {expandedId === s.sessionId ? "Hide journey" : "View journey"}
                  </button>
                </div>

                {expandedId === s.sessionId && (
                  <div className="mt-2 rounded-md bg-slate-50 p-3 pl-1">
                    {loadingId === s.sessionId ? (
                      <p className="text-xs text-slate-500">Loading…</p>
                    ) : (
                      <ol className="space-y-1 text-xs">
                        {(journeys[s.sessionId] ?? []).map((pv, i) => (
                          <li className="flex gap-2" key={pv.id}>
                            <span className="w-5 shrink-0 font-mono text-slate-400">{i + 1}.</span>
                            <span className="font-bold text-slate-800">{pv.path}</span>
                            <span className="text-slate-400">{formatDateTime(pv.createdAt)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
