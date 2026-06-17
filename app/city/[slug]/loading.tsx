import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk } from "@/components/shared/Skeleton";

export default function CityPageLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* city header */}
      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Sk className="h-4 w-24" />
          <Sk className="mt-3 h-9 w-56" />
          <Sk className="mt-2 h-5 w-80" />
        </div>
      </section>

      {/* model cards */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Sk className="mb-6 h-6 w-44" />
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Sk className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <Sk className="h-8 w-8 rounded-md" />
                  <Sk className="h-5 w-28" />
                </div>
                <Sk className="h-4 w-full" />
                <Sk className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
