// Thin wrapper over Resend's HTTP API -- used for transactional emails this
// app authors itself (seller email verification), as opposed to Supabase
// Auth's own templated emails (password reset, which still go out through
// Supabase, just relayed via Resend as the configured SMTP provider).
export async function sendTransactionalEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL).");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `Resend API error (HTTP ${response.status})`);
  }
}
