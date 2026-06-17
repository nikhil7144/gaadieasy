import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk, SkDark } from "@/components/shared/Skeleton";

export default function OnRoadPriceLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* hero */}
      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:py-14">
          <div className="space-y-4">
            <div className="flex gap-2">
              <SkDark className="h-7 w-24 rounded-full" />
              <SkDark className="h-7 w-32 rounded-full" />
            </div>
            <SkDark className="h-12 w-3/4" />
            <SkDark className="h-6 w-1/3" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <SkDark className="h-20 rounded-lg" />
              <SkDark className="h-20 rounded-lg" />
              <SkDark className="h-20 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkDark key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <SkDark className="aspect-[16/10] rounded-xl" />
        </div>
      </section>

      {/* sticky nav placeholder */}
      <div className="border-b border-emerald-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Sk key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        {/* left */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Sk className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-5/6" />
              <Sk className="h-4 w-4/6" />
            </div>
          </div>

          {/* variant table */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Sk className="h-6 w-56" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Sk key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* price breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Sk className="h-6 w-44" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Sk key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>

          {/* spec section */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Sk className="h-6 w-48" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <Sk key={j} className="h-14 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Sk className="h-5 w-36" />
            <Sk className="mt-3 h-10 w-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Sk key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Sk className="h-5 w-24" />
            <div className="mt-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Sk key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
