import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk } from "@/components/shared/Skeleton";

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* type tabs */}
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Sk key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Sk key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* model grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Sk className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Sk className="h-3 w-16" />
                <Sk className="h-5 w-32" />
                <Sk className="h-4 w-full" />
                <Sk className="mt-1 h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
