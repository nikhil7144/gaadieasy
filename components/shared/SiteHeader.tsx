import Link from "next/link";
import { HeaderSearch } from "@/components/public/HeaderSearch";
import { BrandLockup } from "@/components/shared/BrandLockup";

const vehicleTypes = [
  ["Cars", "/?type=cars#vehicle-home"],
  ["Bikes", "/?type=bikes#vehicle-home"],
  ["Scooters", "/?type=scooters#vehicle-home"],
  ["EV Vehicles", "/?type=ev#vehicle-home"],
  ["Commercial", "/?type=commercial#vehicle-home"],
  ["EV Commercial", "/?type=ev-commercial#vehicle-home"],
  ["Passenger EV", "/?type=passenger-ev#vehicle-home"],
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0">
            <BrandLockup href="/" showTagline />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="w-full max-w-[760px]">
              <HeaderSearch />
            </div>
          </div>
          <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            <Link className="transition hover:text-slate-950" href="/seo/hyundai-creta-on-road-price-in-bangalore">
              City pages
            </Link>
            <Link className="transition hover:text-slate-950" href="/compare">
              Compare
            </Link>
          </nav>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-2 overflow-x-auto pb-1">
          {vehicleTypes.map(([label, href]) => (
            <Link
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-lime-300 hover:text-slate-950"
              href={href}
              key={label}
            >
              {label}
            </Link>
          ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
