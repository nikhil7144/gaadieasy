"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { HeaderSearch } from "@/components/public/HeaderSearch";
import { BrandLockup } from "@/components/shared/BrandLockup";

const vehicleTypes = [
  ["Cars", "/?type=cars"],
  ["Bikes", "/?type=bikes"],
  ["Scooters", "/?type=scooters"],
  ["EV Vehicles", "/?type=ev"],
  ["Commercial", "/?type=commercial"],
  ["EV Commercial", "/?type=ev-commercial"],
  ["Passenger EV", "/?type=passenger-ev"],
];

export function SiteHeader({ scrollable = false }: { scrollable?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`border-b-2 border-lime-300/60 bg-white/90 backdrop-blur ${scrollable ? "" : "sticky top-0 z-40"}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">

        {/* Top row */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <BrandLockup href="/" showTagline />
          </div>

          {/* Desktop search */}
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div className="w-full max-w-[760px]">
              <HeaderSearch />
            </div>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <Link className="transition hover:text-slate-950" href="/vehicle-updates">
              Vehicle Updates
            </Link>
            <Link className="transition hover:text-slate-950" href="/city/bangalore">
              City pages
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="ml-auto rounded-md p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile search — always visible */}
        <div className="mt-3 lg:hidden">
          <HeaderSearch />
        </div>

        {/* Desktop vehicle type pills */}
        <div className="mt-3 hidden lg:flex">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-2">
            {vehicleTypes.map(([label, href]) => (
              <Link
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-lime-300 hover:bg-lime-300 hover:text-slate-950"
                href={href}
                key={label}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile drawer */}
        <div className={`overflow-hidden transition-all duration-200 ease-in-out lg:hidden ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="border-t border-slate-100 pb-2 pt-4">
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Browse by type</p>
            <div className="grid grid-cols-2 gap-2">
              {vehicleTypes.map(([label, href]) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-700 transition hover:border-lime-300 hover:bg-lime-300 hover:text-slate-950"
                  href={href}
                  key={label}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-4 flex gap-5 border-t border-slate-100 pb-1 pt-3">
              <Link
                className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                href="/vehicle-updates"
                onClick={() => setMenuOpen(false)}
              >
                Vehicle Updates
              </Link>
              <Link
                className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                href="/city/bangalore"
                onClick={() => setMenuOpen(false)}
              >
                City pages
              </Link>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
