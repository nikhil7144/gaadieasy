import Link from "next/link";
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandLockup href="/" showTagline />
        <nav className="order-3 flex w-full gap-2 overflow-x-auto md:order-none md:w-auto">
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
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
          <Link href="/on-road-price">On-road price</Link>
          <Link href="/seo/hyundai-creta-on-road-price-in-bangalore">City pages</Link>
          <Link href="/compare">Compare</Link>
        </nav>
        <Link
          href="/on-road-price"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm shadow-emerald-200 transition hover:bg-lime-400"
        >
          Check price
        </Link>
      </div>
    </header>
  );
}
