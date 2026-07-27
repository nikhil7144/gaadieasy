"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingCart, Store, User, X } from "lucide-react";

type Category = { id: string; name: string; slug: string; level: number; parentId?: string };

function GearSearchForm({ initialQuery = "", className = "" }: { initialQuery?: string; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/gaadigear/products?q=${encodeURIComponent(query)}` : "/gaadigear/products");
  }

  return (
    <form className={`relative ${className}`} onSubmit={handleSubmit}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        className="min-h-10 w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search accessories, parts, riding gear…"
        type="search"
        value={value}
      />
    </form>
  );
}

export function GearSiteHeader({
  categories,
  activeCategorySlug,
  cartCount = 0,
  initialQuery = "",
}: {
  categories: Category[];
  activeCategorySlug?: string;
  cartCount?: number;
  initialQuery?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMobileParent, setOpenMobileParent] = useState<string | null>(null);

  const l1 = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const l2ByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.level === 2 && c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(c.parentId, list);
      }
    }
    return map;
  }, [categories]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-3 sm:gap-4">
          <Link className="flex shrink-0 items-center" href="/gaadigear">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="GaadiGear" className="h-6 w-auto sm:h-8" src="/gaadigear-logo.png" />
          </Link>

          <GearSearchForm className="max-w-xl flex-1" initialQuery={initialQuery} />

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link className="hidden text-sm font-bold text-slate-600 transition hover:text-slate-950 sm:inline" href="/gaadigear/sell">
              <span className="flex items-center gap-1.5">
                <Store size={16} /> Sell
              </span>
            </Link>
            <Link className="text-slate-600 transition hover:text-slate-950" href="/gaadigear/account">
              <User size={20} />
            </Link>
            <Link className="relative text-slate-600 transition hover:text-slate-950" href="/gaadigear/cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-950">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <button className="rounded-md p-1.5 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen((m) => !m)} type="button">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav className="hidden flex-wrap items-center gap-2 border-t border-slate-100 py-2.5 lg:flex">
          {l1.map((c) => {
            const isActive = activeCategorySlug === c.slug;
            const children = l2ByParent.get(c.id) ?? [];
            return (
              <div className="group relative shrink-0" key={c.id}>
                <Link
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                    isActive
                      ? "border-lime-400 bg-lime-300 text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 group-hover:border-lime-300 group-hover:bg-lime-300 group-hover:text-slate-950"
                  }`}
                  href={`/gaadigear/products?category=${c.slug}`}
                >
                  {c.name}
                  {children.length > 0 && <ChevronDown size={12} />}
                </Link>

                {children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                    {children.map((child) => (
                      <Link
                        className="block rounded-md px-3 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                        href={`/gaadigear/products?category=${c.slug}&subcategory=${child.slug}`}
                        key={child.id}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {menuOpen && (
          <div className="space-y-1 border-t border-slate-100 py-3 lg:hidden">
            {l1.map((c) => {
              const children = l2ByParent.get(c.id) ?? [];
              const isOpen = openMobileParent === c.id;
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-1">
                    <Link
                      className={`flex-1 rounded-md border px-3 py-2 text-xs font-black ${
                        activeCategorySlug === c.slug ? "border-lime-400 bg-lime-300 text-slate-950" : "border-slate-200 text-slate-600"
                      }`}
                      href={`/gaadigear/products?category=${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {c.name}
                    </Link>
                    {children.length > 0 && (
                      <button
                        className="rounded-md border border-slate-200 p-2 text-slate-500"
                        onClick={() => setOpenMobileParent(isOpen ? null : c.id)}
                        type="button"
                      >
                        <ChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} size={14} />
                      </button>
                    )}
                  </div>
                  {isOpen && children.length > 0 && (
                    <div className="ml-3 mt-1 flex flex-wrap gap-1.5 border-l border-slate-100 pl-3">
                      {children.map((child) => (
                        <Link
                          className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600"
                          href={`/gaadigear/products?category=${c.slug}&subcategory=${child.slug}`}
                          key={child.id}
                          onClick={() => setMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
