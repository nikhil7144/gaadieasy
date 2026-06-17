import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk, SkDark } from "@/components/shared/Skeleton";

export default function VehicleUpdatesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* page header */}
      <section className="bg-slate-950 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <SkDark className="h-4 w-32 rounded-full" />
          <SkDark className="mt-3 h-10 w-64 rounded" />
          <SkDark className="mt-3 h-5 w-96 rounded" />
        </div>
      </section>

      {/* story grid */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Sk className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-2 p-5">
                <div className="flex gap-2">
                  <Sk className="h-5 w-20 rounded-full" />
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
                <Sk className="h-6 w-4/5" />
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
