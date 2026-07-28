import Link from "next/link";
import {
  ArrowRight,
  Backpack,
  Bike,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Gauge,
  HardHat,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquareQuote,
  PackageSearch,
  Plug,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Star,
  Tag,
  Target,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { GearBrandLockup } from "@/components/shared/GearBrandLockup";
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

// Same icon language as the GaadiGear header nav (GearSiteHeader.tsx), keyed
// by category slug -- kept consistent across surfaces rather than invented
// fresh here. Blurbs describe what actually sells in each category, not
// generic filler.
const CATEGORY_INFO: Record<string, { icon: LucideIcon; blurb: string }> = {
  parts: { icon: Wrench, blurb: "Engine components, filters, batteries, tyres" },
  "interior-comfort": { icon: Sofa, blurb: "Seat covers, floor mats, cushions" },
  "exterior-styling": { icon: Sparkles, blurb: "Wraps, decals, alloy wheels, body kits" },
  "bike-accessories": { icon: Bike, blurb: "Mirrors, guards, saddle bags, grips" },
  "riding-gear": { icon: HardHat, blurb: "Helmets, jackets, gloves, boots" },
  "riding-travel-accessories": { icon: Backpack, blurb: "Top boxes, panniers, phone mounts" },
  "electronics-charging": { icon: Plug, blurb: "Dash cams, chargers, GPS trackers" },
  "fleet-compliance": { icon: ClipboardCheck, blurb: "Fleet tracking, compliance kits" },
  "care-maintenance": { icon: SprayCan, blurb: "Polish, cleaning kits, lubricants" },
};

const faq = [
  { q: "What do I need to sign up?", a: "Just a business name and email to start — we verify your email first, then you set a password and continue. You'll also need a valid PAN and at least one KYC document (GST certificate, PAN card, cancelled cheque, or address proof) before your application can be reviewed." },
  { q: "Do I need a GSTIN to sell?", a: "No — GSTIN is optional. PAN is the only tax ID that's required, so individual sellers and small businesses without GST registration can still sell." },
  { q: "Do I need my bank details ready to sign up?", a: "No. Bank details aren't part of signup at all — add them anytime from your seller dashboard once you're approved, before your first payout is due." },
  { q: "How much does it cost to list a product?", a: "Nothing upfront — there's no listing fee and no subscription. Commission is per product: a flat ₹25 for anything priced up to ₹700, and 7% of the amount above ₹700 for anything priced higher — nothing on the shipping fee you collect." },
  { q: "Who handles delivery?", a: "You do. We collect payment from the buyer and pay you out weekly — you ship using your own courier of choice." },
  { q: "How long does approval take?", a: "Typically 1-2 business days once your KYC documents are submitted. You can still set up products, upload documents, and fill in your storefront while your application is under review." },
  { q: "When do I get paid?", a: "Weekly, for any delivered shipment where the 3-day return window has passed with no refund request." },
  { q: "What happens if a buyer requests a refund?", a: "Refund requests go through a review before approval — an approved refund is deducted from your next payout, not billed to you separately." },
  { q: "Can I list in more than one category?", a: "Yes — list in as many of the open categories as fit your catalogue, there's no per-category fee." },
];

const whySell: { icon: LucideIcon; title: string; body: string; accent: Accent }[] = [
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
    body: "A flat ₹25 on lower-priced items, 7% above ₹700 — clear either way. No listing fees, no cut on the shipping fee you collect.",
    accent: "emerald",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard built for this",
    body: "List products with size/color variants, track orders and shipments, and see payouts — all in one place.",
    accent: "lime",
  },
  {
    icon: ShieldCheck,
    title: "A verified-seller marketplace",
    body: "Every seller goes through email verification and a KYC review before going live — buyers are shopping a vetted storefront, not an open listings board.",
    accent: "amber",
  },
  {
    icon: Target,
    title: "No ad spend, no bidding",
    body: "Placement follows vehicle-model fit, not who paid the most for a keyword — you don't need an ads budget to be seen.",
    accent: "emerald",
  },
];

const steps: { icon: LucideIcon; t: string; d: string; accent: Accent }[] = [
  { icon: Mail, t: "Verify your email", d: "Confirm your email first — before you fill in anything else", accent: "lime" },
  { icon: FileCheck, t: "Set up & get verified", d: "Business details, one KYC document, and you're in review — typically 1-2 business days", accent: "amber" },
  { icon: PackageSearch, t: "List your products", d: "Photos, pricing, and which vehicles they fit", accent: "emerald" },
  { icon: Wallet, t: "Get orders, get paid", d: "We collect payment, you ship, we pay you out weekly", accent: "lime" },
];

// Hand-drawn, not a lucide icon -- lucide has no motorcycle-helmet/riding-jacket
// glyphs, and the earlier stand-ins (HardHat, Shirt) read as a construction
// helmet and a plain t-shirt instead. Flat/geometric to match the rest of
// this page's illustration style, sized for the 88px slot in the hero badge.
function BikeHelmetIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="88" viewBox="0 0 100 100" width="88" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 8c19 0 32 15 32 34 0 17-7 31-18 41-4 3.5-9 5.5-14 5.5s-10-2-14-5.5C25 73 18 59 18 42 18 23 31 8 50 8Z"
        fill="currentColor"
        opacity="0.92"
      />
      <rect fill="#0f172a" height="4" opacity="0.5" rx="2" width="16" x="42" y="16" />
      <rect fill="#bef264" height="17" rx="8.5" width="56" x="22" y="40" />
      <circle cx="80" cy="48" fill="#0f172a" opacity="0.5" r="3" />
    </svg>
  );
}

function RidingJacketIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="88" viewBox="0 0 100 100" width="88" xmlns="http://www.w3.org/2000/svg">
      <path d="M42 20 L50 11 L58 20 L50 27 Z" fill="currentColor" opacity="0.92" />
      <path d="M35 20 L65 20 L74 86 L26 86 Z" fill="currentColor" opacity="0.92" />
      <path d="M35 22 L17 31 L21 63 L34 58 Z" fill="currentColor" opacity="0.92" />
      <path d="M65 22 L83 31 L79 63 L66 58 Z" fill="currentColor" opacity="0.92" />
      <rect fill="#0f172a" height="70" opacity="0.35" rx="1.5" width="3" x="48.5" y="15" />
      <rect fill="#0f172a" height="6" opacity="0.35" rx="1.5" width="7" x="46.5" y="15" />
      <rect fill="#bef264" height="9" rx="3" transform="rotate(-18 27 32)" width="17" x="18.5" y="27.5" />
      <rect fill="#bef264" height="9" rx="3" transform="rotate(18 73 32)" width="17" x="64.5" y="27.5" />
    </svg>
  );
}

const seoHighlights = [
  "SEO-optimized product pages",
  "Higher visibility on Google",
  "Featured in marketplace collections",
  "Free promotional campaigns",
  "Increased organic traffic and product discovery",
];

const reviewsHighlights = [
  "Verified customer ratings & reviews",
  "Build long-term brand credibility",
  "Increase buyer confidence",
  "Higher conversion rates",
  "Encourage repeat customers and loyalty",
];

const navLinks = [
  { href: "#why-sell", label: "Why sell here" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#categories", label: "Categories" },
  { href: "#get-started", label: "What you need" },
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
    { v: "₹25", l: "Flat fee on orders up to ₹700", accent: "amber" },
    { v: "7%", l: "On the amount above ₹700", accent: "emerald" },
  ];

  const checklist = [
    { title: "Business name & email", detail: "We verify your email before anything else — with a change-email option if you typo it." },
    { title: "PAN (required)", detail: "The only tax ID you must have. GSTIN is optional." },
    { title: "One KYC document", detail: "GST certificate, PAN card, cancelled cheque, or address proof — uploaded directly, not a pasted link." },
  ];

  return (
    <main className="bg-white">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <GearBrandLockup size="header" />
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
        <div
          className="pointer-events-none absolute -left-10 top-1/2 hidden -translate-y-1/2 lg:block"
          aria-hidden="true"
        >
          <div className="relative grid h-52 w-52 place-items-center rounded-full bg-slate-950 shadow-xl">
            <BikeHelmetIllustration className="text-lime-300" />
            <span className="absolute -right-2 -top-2 grid h-11 w-11 rotate-6 place-items-center rounded-2xl bg-lime-300 shadow-md">
              <ShieldCheck className="text-slate-950" size={20} />
            </span>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 lg:block"
          aria-hidden="true"
        >
          <div className="relative grid h-52 w-52 place-items-center rounded-full bg-emerald-600 shadow-xl">
            <RidingJacketIllustration className="text-white" />
            <span className="absolute -left-2 -top-2 grid h-11 w-11 -rotate-6 place-items-center rounded-2xl bg-white shadow-md">
              <Sparkles className="text-emerald-600" size={20} />
            </span>
          </div>
        </div>

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

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Why the traffic is different</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Your buyer already picked the vehicle. Now they need everything that goes with it.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Every visitor on GaadiGear arrived after checking a specific vehicle&apos;s on-road price on Gaadieasy — they&apos;re not
              casually browsing, they&apos;re deep in the buying decision for that exact model. That&apos;s the moment they start
              thinking about seat covers, a service kit, riding gear, or styling parts — and your product is right there on the
              page for the vehicle it fits.
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              There&apos;s no keyword auction to win. Placement follows vehicle-model fit, so a helmet brand shows up on bike
              pages and a car mat seller shows up on car pages — automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-lime-200 bg-lime-50 p-5 text-center">
              <div className="text-3xl font-black text-lime-700">{stats.vehicleModelCount}+</div>
              <div className="mt-1 text-xs font-bold text-slate-600">Vehicle models buyers research here</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="text-3xl font-black text-emerald-700">{stats.categoryCount}</div>
              <div className="mt-1 text-xs font-bold text-slate-600">Categories already open for listing</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6" id="why-sell">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">Why sell here</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Best-in-class SEO &amp; free product promotion</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Get found. Get clicks. Get more sales.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Your products deserve visibility. Every product you list is automatically optimized for search engines with
              SEO-friendly URLs, structured product pages, rich metadata, and fast-loading pages to help customers discover
              your brand organically.
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              We also promote your products across featured collections, category pages, trending sections, seasonal
              campaigns, and marketplace recommendations — giving your brand additional exposure at no extra cost.
            </p>
            <ul className="mt-5 space-y-2">
              {seoHighlights.map((h) => (
                <li className="flex items-start gap-2 text-sm font-bold text-slate-700" key={h}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                  {h}
                </li>
              ))}
            </ul>
            <Link
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-400"
              href="/gaadigear/sell/signup"
            >
              Start Listing Products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="order-1 md:order-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center gap-1.5 rounded-t-lg bg-white px-3 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-red-300" />
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                <span className="ml-2 flex-1 truncate rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-400">
                  gaadieasy.com/gaadigear/products/…
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <Search size={12} /> gaadieasy.com › gaadigear › riding-gear
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-950">Full-Face Riding Helmet — ISI Certified | GaadiGear</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Fits 40+ bike models. Verified seller, weekly dispatch. Compare sizes, colors and reviews before you buy…
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">Rich snippet</span>
                  <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-black text-lime-700">Featured</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2.5 shadow-sm">
                  <Gauge className="mx-auto text-emerald-600" size={16} />
                  <p className="mt-1 text-[10px] font-black text-slate-600">Fast pages</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-sm">
                  <Smartphone className="mx-auto text-emerald-600" size={16} />
                  <p className="mt-1 text-[10px] font-black text-slate-600">Mobile-ready</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-sm">
                  <Search className="mx-auto text-emerald-600" size={16} />
                  <p className="mt-1 text-[10px] font-black text-slate-600">SEO built-in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star fill="currentColor" key={i} size={16} strokeWidth={0} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">Verified buyer ratings</p>
                </div>
                <MessageSquareQuote className="text-emerald-200" size={32} />
              </div>
              <div className="mt-4 space-y-3">
                {[100, 75, 90].map((width, i) => (
                  <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3" key={i}>
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                      {["A", "S", "R"][i]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[0, 1, 2, 3, 4].map((s) => (
                          <Star fill="currentColor" key={s} size={11} strokeWidth={0} />
                        ))}
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100" style={{ width: `${width}%` }} />
                      <div className="mt-1.5 h-2 w-2/3 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Build a trusted brand with customer reviews</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Earn trust. Grow faster.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Customers buy from brands they trust. Showcase authentic customer reviews and ratings to build credibility,
              increase buyer confidence, and improve conversion rates.
            </p>
            <p className="mt-3 text-base leading-7 text-slate-600">
              A strong reputation helps your products stand out from competitors and encourages repeat purchases. As your
              reviews grow, so does your brand&apos;s authority within the marketplace.
            </p>
            <ul className="mt-5 space-y-2">
              {reviewsHighlights.map((h) => (
                <li className="flex items-start gap-2 text-sm font-bold text-slate-700" key={h}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} />
                  {h}
                </li>
              ))}
            </ul>
            <Link
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-400"
              href="/gaadigear/sell/signup"
            >
              Grow Your Brand Reputation <ArrowRight size={16} />
            </Link>
          </div>
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
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          Nine categories are already open, spanning every kind of vehicle on Gaadieasy — list in as many as fit your catalogue.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {l1Categories.map((c, i) => {
            const a = (["lime", "amber", "emerald"] as const)[i % 3];
            const info = CATEGORY_INFO[c.slug];
            const Icon = info?.icon ?? Tag;
            return (
              <div
                className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm ${accent[a].cardHoverBorder}`}
                key={c.id}
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${accent[a].chipBg} ${accent[a].tagText}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">{c.name}</p>
                  {info?.blurb && <p className="mt-0.5 text-xs leading-5 text-slate-500">{info.blurb}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6" id="get-started">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">What you need to get started</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Signup is deliberately light — the only thing required upfront is enough to verify you&apos;re real. Everything else
            can wait until you&apos;re already in.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {checklist.map((item) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4" key={item.title}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="shrink-0 text-emerald-600" size={18} />
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-50 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">Commission & fees</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            A flat ₹25 on anything priced up to ₹700, 7% above that — no listing fee, no fee on the shipping you collect.
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
