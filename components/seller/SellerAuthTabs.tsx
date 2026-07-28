"use client";

import { Suspense, useState } from "react";
import { MapPin, RefreshCw, Wallet } from "lucide-react";
import { GearBrandLockup } from "@/components/shared/GearBrandLockup";
import { SellerLoginForm } from "@/components/seller/SellerLoginForm";
import { SellerSignupWizard } from "@/components/seller/SellerSignupWizard";
import type { GearCategory } from "@/types/automobile";

type Tab = "login" | "signup";

const valueProps = [
  { icon: MapPin, text: "Placed on the exact vehicle page a buyer is already looking at", bg: "bg-lime-100", text_: "text-lime-700" },
  { icon: Wallet, text: "We handle payments — you just handle delivery", bg: "bg-amber-100", text_: "text-amber-700" },
  { icon: RefreshCw, text: "Weekly payouts, transparent commission, no listing fee", bg: "bg-emerald-100", text_: "text-emerald-700" },
];

export function SellerAuthTabs({
  initialTab,
  l1Categories,
  stats,
}: {
  initialTab: Tab;
  l1Categories: GearCategory[];
  stats: { vehicleModelCount: number; categoryCount: number };
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-lime-50 via-white to-emerald-50 px-8 py-12 sm:px-14">
        <div className="relative mx-auto w-full max-w-md">
          <GearBrandLockup size="header" />
          <p className="mt-6 inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
            GaadiGear for sellers
          </p>
          <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
            Sell accessories to riders and drivers already on Gaadieasy
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            List parts, riding gear and accessories, scoped to the exact vehicles they fit.
          </p>

          <div className="mt-8 space-y-3">
            {valueProps.map(({ icon: Icon, text, bg, text_ }) => (
              <div className="flex items-start gap-3" key={text}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${bg} ${text_}`}>
                  <Icon size={16} />
                </div>
                <p className="pt-1 text-sm leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-100 bg-white/80 p-3 text-center">
              <div className="text-xl font-black text-emerald-700">{stats.vehicleModelCount}+</div>
              <div className="mt-0.5 text-[11px] font-bold text-slate-500">Vehicle models</div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white/80 p-3 text-center">
              <div className="text-xl font-black text-amber-600">{stats.categoryCount}</div>
              <div className="mt-0.5 text-[11px] font-bold text-slate-500">Categories open</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-14">
        <div className="w-full max-w-md">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 text-sm font-black">
            <button
              className={`flex-1 rounded-md py-2 transition ${tab === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
              onClick={() => setTab("login")}
              type="button"
            >
              Log in
            </button>
            <button
              className={`flex-1 rounded-md py-2 transition ${tab === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
              onClick={() => setTab("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>

          {tab === "login" ? (
            <Suspense fallback={null}>
              <SellerLoginForm />
            </Suspense>
          ) : (
            <Suspense fallback={null}>
              <SellerSignupWizard l1Categories={l1Categories} />
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}
