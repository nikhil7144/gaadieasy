import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyPendingSellerSignupToken, verifySellerEmailToken } from "@/lib/services/seller-auth";

export default async function SellerVerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  // Pre-account path first: a prospective seller verifying before their real
  // account exists yet -- continue the signup wizard's password step in this
  // same tab, no need to switch back to wherever signup was started.
  const pending = token ? await verifyPendingSellerSignupToken(token) : null;
  if (pending) redirect(`/gaadigear/sell/signup?pending=${pending.id}`);

  // Defensive/back-compat fallback: an already-created seller (from before
  // this flow existed, or any other edge case) verifying after the fact.
  const seller = token ? await verifySellerEmailToken(token) : null;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        {seller ? (
          <>
            <h1 className="text-2xl font-black text-slate-950">Email verified</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Thanks, {seller.businessName} — your email is confirmed. Log in to continue.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-950">Link expired or invalid</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This verification link isn&apos;t valid anymore. Start signing up again, or log in if you already have an
              account.
            </p>
          </>
        )}
        <Link
          className="mt-6 inline-block w-full rounded-lg bg-slate-950 px-4 py-3 text-base font-black text-white transition hover:bg-slate-800"
          href="/gaadigear/sell/login?verified=1"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
