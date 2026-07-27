import Link from "next/link";
import { UserCircle2 } from "lucide-react";

export function GearGuestSignInBanner({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <UserCircle2 className="shrink-0 text-emerald-700" size={20} />
        <p className="text-sm font-bold text-slate-800">
          Sign in to track this order and see it later in My Orders — or continue as a guest, it&apos;s optional.
        </p>
      </div>
      <Link
        className="shrink-0 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700"
        href={`/gaadigear/account/login?redirect=${encodeURIComponent(redirectTo)}`}
      >
        Sign in
      </Link>
    </div>
  );
}
