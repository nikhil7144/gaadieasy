"use client";

import { useState } from "react";

export function SellerResendVerificationButton({ email }: { email?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    if (!email) return;
    setState("sending");
    try {
      const response = await fetch("/api/seller/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <p className="text-sm font-bold text-emerald-700">Sent — check your inbox (and spam folder).</p>;

  return (
    <div>
      <button
        className="rounded-lg border border-current px-4 py-2 text-sm font-black disabled:opacity-50"
        disabled={state === "sending" || !email}
        onClick={resend}
        type="button"
      >
        {state === "sending" ? "Sending…" : "Resend verification email"}
      </button>
      {state === "error" && <p className="mt-2 text-xs font-bold text-red-600">Couldn&apos;t resend — try again in a moment.</p>}
    </div>
  );
}
