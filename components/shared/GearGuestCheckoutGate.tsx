"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, UserCircle2 } from "lucide-react";

const ACK_KEY = "gaadigear_guest_checkout_ack";

function alreadyAcknowledged() {
  return typeof window !== "undefined" && sessionStorage.getItem(ACK_KEY) === "1";
}

// A guided decision point, not a passive banner: before a guest sees the
// checkout form, they have to actually choose sign-in or "continue as
// guest" -- once chosen (this browser session), it doesn't ask again.
export function GearGuestCheckoutGate({ redirectTo, children }: { redirectTo: string; children: React.ReactNode }) {
  const [resolved, setResolved] = useState(alreadyAcknowledged);

  function continueAsGuest() {
    sessionStorage.setItem(ACK_KEY, "1");
    setResolved(true);
  }

  if (resolved) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center px-4 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <UserCircle2 size={28} />
      </span>
      <h1 className="mt-5 text-2xl font-black text-slate-950">Sign in before you check out?</h1>
      <p className="mt-2 text-sm text-slate-500">
        Create a free account to track this order, save your address for next time, and find it later in My Orders.
        Completely optional — you can check out as a guest instead.
      </p>

      <Link
        className="mt-7 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400"
        href={`/gaadigear/account/login?redirect=${encodeURIComponent(redirectTo)}`}
      >
        Sign in or create account
      </Link>
      <button
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={continueAsGuest}
        type="button"
      >
        Continue as guest
      </button>

      <p className="mt-6 flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <ShieldCheck size={14} /> Your cart is saved either way — nothing is lost by choosing.
      </p>
    </div>
  );
}
