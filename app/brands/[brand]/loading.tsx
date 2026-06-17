import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk } from "@/components/shared/Skeleton";

export default function BrandLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* brand hero */}
      <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <Sk className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Sk className="h-8 w-40" />
              <Sk className="h-4 w-64" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Sk key={i} className="h-16 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* model grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Sk className="mb-6 h-7 w-48" />
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Sk className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Sk className="h-3 w-16" />
                <Sk className="h-5 w-32" />
                <Sk className="h-4 w-full" />
                <div className="flex gap-2 pt-1">
                  <Sk className="h-6 w-16 rounded-full" />
                  <Sk className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
