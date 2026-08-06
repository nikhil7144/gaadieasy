import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyPendingDealerSignupToken } from "@/lib/services/dealer-auth";

export default async function DealerVerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const pending = token ? await verifyPendingDealerSignupToken(token) : null;

  if (pending) redirect(`/dealer/signup?pending=${pending.id}`);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Link expired or invalid</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This verification link isn&apos;t valid anymore. Start signing up again, or log in if you already have an
          account.
        </p>
        <Link
          className="mt-6 inline-block w-full rounded-lg bg-slate-950 px-4 py-3 text-base font-black text-white transition hover:bg-slate-800"
          href="/dealer/login"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
