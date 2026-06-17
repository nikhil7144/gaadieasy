"use client";

const TABS = [
  ["Overview", "overview"],
  ["Price", "price"],
  ["Variants", "variants"],
  ["Specs", "specs"],
  ["Colors", "colors"],
  ["EMI", "emi"],
  ["Dealer", "lead"],
  ["FAQs", "faqs"],
] as const;

export function VehiclePageNav() {
  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-lime-200 bg-lime-100">
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {TABS.map(([label, id]) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-lime-200 active:bg-lime-300"
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
