"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Car, Bike, Zap, Truck, BatteryCharging, Users } from "lucide-react";
import { HeaderSearch } from "@/components/public/HeaderSearch";
import { BrandLockup } from "@/components/shared/BrandLockup";

const vehicleTypes = [
  { label: "Cars", href: "/?type=cars", key: "cars", Icon: Car },
  { label: "Bikes", href: "/?type=bikes", key: "bikes", Icon: Bike },
  { label: "Scooters", href: "/?type=scooters", key: "scooters", Icon: Bike },
  { label: "EV Vehicles", href: "/?type=ev", key: "ev", Icon: Zap },
  { label: "Commercial", href: "/?type=commercial", key: "commercial", Icon: Truck },
  { label: "EV Commercial", href: "/?type=ev-commercial", key: "ev-commercial", Icon: BatteryCharging },
  { label: "Passenger EV", href: "/?type=passenger-ev", key: "passenger-ev", Icon: Users },
];

export function SiteHeader({ scrollable = false, activeType }: { scrollable?: boolean; activeType?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`border-b-2 border-lime-300/60 bg-white/90 backdrop-blur z-40 ${scrollable ? "relative" : "sticky top-0"}`}>
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
            <Link className="font-black text-emerald-700 transition hover:text-emerald-800" href="/gaadigear">
              GaadiGear
            </Link>
            <Link className="transition hover:text-slate-950" href="/experiences">
              Experiences
            </Link>
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
            {vehicleTypes.map(({ label, href, key, Icon }) => {
              const isActive = activeType === key;
              return (
                <Link
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                    isActive
                      ? "border-lime-400 bg-lime-300 text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-lime-300 hover:bg-lime-300 hover:text-slate-950"
                  }`}
                  href={href}
                  key={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile drawer */}
        <div className={`overflow-hidden transition-all duration-200 ease-in-out lg:hidden ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="border-t border-slate-100 pb-2 pt-4">
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Browse by type</p>
            <div className="grid grid-cols-2 gap-2">
              {vehicleTypes.map(({ label, href, key, Icon }) => {
                const isActive = activeType === key;
                return (
                  <Link
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-black transition ${
                      isActive
                        ? "border-lime-400 bg-lime-300 text-slate-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-lime-300 hover:bg-lime-300 hover:text-slate-950"
                    }`}
                    href={href}
                    key={label}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex gap-5 border-t border-slate-100 pb-1 pt-3">
              <Link
                className="text-sm font-black text-emerald-700 transition hover:text-emerald-800"
                href="/gaadigear"
                onClick={() => setMenuOpen(false)}
              >
                GaadiGear
              </Link>
              <Link
                className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                href="/experiences"
                onClick={() => setMenuOpen(false)}
              >
                Experiences
              </Link>
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
