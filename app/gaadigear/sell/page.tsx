import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  RefreshCw,
  Tag,
  Wallet,
} from "lucide-react";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { getGearCategories, getGaadiGearLandingStats } from "@/lib/services/gear-admin";

type Accent = "lime" | "amber" | "emerald";

// Full literal class strings per accent (not string-built) so Tailwind's
// scanner picks them all up. Light theme throughout -- shades of green plus
// amber for variety, no dark sections and no blue.
const accent: Record<Accent, { chipBg: string; chipText: string; chipHoverBg: string; cardHoverBorder: string; tagText: string; statText: string; statBorder: string; circleBg: string; circleText: string }> = {
  lime: {
    chipBg: "bg-lime-50",
    chipText: "text-lime-700",
    chipHoverBg: "group-hover:bg-lime-400 group-hover:text-slate-950",
    cardHoverBorder: "hover:border-lime-300",
    tagText: "text-lime-600",
    statText: "text-lime-700",
    statBorder: "border-lime-200",
    circleBg: "bg-lime-400",
    circleText: "text-slate-950",
  },
  amber: {
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    chipHoverBg: "group-hover:bg-amber-400 group-hover:text-slate-950",
    cardHoverBorder: "hover:border-amber-300",
    tagText: "text-amber-600",
    statText: "text-amber-600",
    statBorder: "border-amber-200",
    circleBg: "bg-amber-400",
    circleText: "text-slate-950",
  },
  emerald: {
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    chipHoverBg: "group-hover:bg-emerald-500 group-hover:text-slate-950",
    cardHoverBorder: "hover:border-emerald-300",
    tagText: "text-emerald-600",
    statText: "text-emerald-700",
    statBorder: "border-emerald-200",
    circleBg: "bg-emerald-500",
    circleText: "text-slate-950",
  },
};

const faq = [
  { q: "How much does it cost to list a product?", a: "Nothing upfront — there's no listing fee. We take a commission per order, and nothing on the shipping fee you collect." },
  { q: "Who handles delivery?", a: "You do. We collect payment from the buyer and pay you out weekly — you ship using your own courier of choice." },
  { q: "How long does approval take?", a: "Typically 1-2 business days once your KYC documents are submitted." },
  { q: "When do I get paid?", a: "Weekly, for any delivered shipment where the 3-day return window has passed with no refund request." },
];

const whySell: { icon: typeof MapPin; title: string; body: string; accent: Accent }[] = [
  {
    icon: MapPin,
    title: "Placed where buyers already are",
    body: "Your product shows up on the exact vehicle page a buyer is already browsing — not buried in a generic search.",
    accent: "lime",
  },
  {
    icon: Wallet,
    title: "We handle payments",
    body: "Buyers pay us, we reconcile it, you just handle delivery with your own courier of choice.",
    accent: "amber",
  },
  {
    icon: RefreshCw,
    title: "Weekly payouts, transparent commission",
    body: "One simple commission rate per order. No listing fees, no cut on the shipping fee you collect.",
    accent: "emerald",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard built for this",
    body: "List products with size/color variants, track orders and shipments, and see payouts — all in one place.",
    accent: "lime",
  },
];

const steps: { icon: typeof ClipboardCheck; t: string; d: string; accent: Accent }[] = [
  { icon: ClipboardCheck, t: "Sign up & get verified", d: "Submit your KYC — typically approved in 1-2 business days", accent: "lime" },
  { icon: PackageSearch, t: "List your products", d: "Photos, pricing, and which vehicles they fit", accent: "amber" },
  { icon: Wallet, t: "Get orders, get paid", d: "We collect payment, you ship, we pay you out weekly", accent: "emerald" },
];

const navLinks = [
  { href: "#why-sell", label: "Why sell here" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#categories", label: "Categories" },
  { href: "#faq", label: "FAQ" },
];

export default async function GaadiGearSellLandingPage() {
  const [categories, stats] = await Promise.all([getGearCategories(), getGaadiGearLandingStats()]);
  const l1Categories = categories.filter((c) => c.level === 1 && c.isActive);

  const heroStats: { value: string; label: string; accent: Accent }[] = [
    { value: `${stats.vehicleModelCount}+`, label: "Vehicle models to get placed on", accent: "lime" },
    { value: `${stats.categoryCount}`, label: "Categories open for listing", accent: "amber" },
    { value: "₹0", label: "Listing fee", accent: "emerald" },
    { value: "Weekly", label: "Payouts", accent: "lime" },
  ];

  const commissionStats: { v: string; l: string; accent: Accent }[] = [
    { v: "₹0", l: "Listing fee", accent: "lime" },
    { v: "1", l: "Simple commission rate", accent: "amber" },
    { v: "Weekly", l: "Payout cycle", accent: "emerald" },
  ];

  return (
    <main className="bg-white">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLockup href="/" size="header" />
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            {navLinks.map((l) => (
              <a className="transition hover:text-emerald-700" href={l.href} key={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link className="hidden text-sm font-bold text-slate-600 transition hover:text-emerald-700 sm:inline" href="/gaadigear/sell/login">
              Sign in
            </Link>
            <Link
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-lime-400"
              href="/gaadigear/sell/signup"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-lime-50 via-white to-emerald-50">
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="mx-auto inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
              GaadiGear for sellers
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Sell your accessories to riders and drivers already on Gaadieasy
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Get placed on the exact vehicle page a buyer is already looking at — no ads, no bidding for traffic.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-400"
                href="/gaadigear/sell/signup"
              >
                Start Selling <ArrowRight size={18} />
              </Link>
              <a
                className="rounded-lg border border-slate-300 px-6 py-3 text-base font-bold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div className={`rounded-lg border ${accent[s.accent].statBorder} bg-white/80 p-4 text-center backdrop-blur`} key={s.label}>
                <div className={`text-2xl font-black ${accent[s.accent].statText}`}>{s.value}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" id="why-sell">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">Why sell here</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {whySell.map(({ icon: Icon, title, body, accent: a }) => (
            <div
              className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${accent[a].cardHoverBorder}`}
              key={title}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-lg ${accent[a].chipBg} ${accent[a].chipText} transition ${accent[a].chipHoverBg}`}>
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6" id="how-it-works">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">How it works</h2>
          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-3">
            {steps.map((step, i) => (
              <div className="flex flex-1 items-stretch gap-3" key={step.t}>
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${accent[step.accent].circleBg} ${accent[step.accent].circleText}`}>
                    <step.icon size={22} />
                  </div>
                  <h3 className="mt-3 text-base font-black text-slate-950">{step.t}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{step.d}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden shrink-0 items-center text-slate-300 md:flex">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" id="categories">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">Categories you can sell in</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {l1Categories.map((c, i) => {
            const a = (["lime", "amber", "emerald"] as const)[i % 3];
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:shadow-sm ${accent[a].cardHoverBorder}`}
                key={c.id}
              >
                <Tag size={14} className={accent[a].tagText} />
                {c.name}
              </span>
            );
          })}
        </div>
      </section>

      <section className="bg-emerald-50 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">Commission & fees</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Simple commission per order, no listing fee, no fee on the shipping you collect.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {commissionStats.map((s) => (
              <div className={`rounded-lg border ${accent[s.accent].statBorder} bg-white p-4`} key={s.l}>
                <div className={`text-xl font-black sm:text-2xl ${accent[s.accent].statText}`}>{s.v}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6" id="faq">
        <h2 className="mb-6 text-center text-2xl font-black text-slate-950 sm:text-3xl">FAQ</h2>
        <div className="space-y-2">
          {faq.map((item) => (
            <details className="group rounded-xl border border-slate-200 bg-white p-4 open:border-emerald-300" key={item.q}>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-950">
                {item.q}
                <span className="ml-3 shrink-0 text-emerald-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-lime-50 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">Ready to get started?</h2>
          <p className="mt-3 text-base text-slate-500">Set up takes a few minutes — approval typically takes 1-2 business days.</p>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-400"
            href="/gaadigear/sell/signup"
          >
            Start Selling <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
