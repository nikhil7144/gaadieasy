import { AdminAnalyticsView } from "@/components/admin/AdminAnalyticsView";
import { getCampaignSummary, getRecentSessions } from "@/lib/services/analytics";

export default async function AdminAnalyticsPage() {
  const [campaigns, sessions] = await Promise.all([getCampaignSummary(), getRecentSessions(100)]);
  return <AdminAnalyticsView campaigns={campaigns} sessions={sessions} />;
}
