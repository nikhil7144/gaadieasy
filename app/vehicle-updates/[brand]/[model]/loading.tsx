import { SiteHeader } from "@/components/shared/SiteHeader";
import { Sk, SkDark } from "@/components/shared/Skeleton";

export default function VehicleStoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* dark hero */}
      <section className="bg-slate-950 px-4 pb-10 pt-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <SkDark className="h-4 w-28 rounded" />
            <SkDark className="h-4 w-20 rounded-full" />
          </div>
          <SkDark className="mt-4 h-4 w-24" />
          <SkDark className="mt-3 h-12 w-3/4" />
          <SkDark className="mt-3 h-6 w-1/2" />
          <div className="mt-4 flex gap-4">
            <SkDark className="h-4 w-36" />
            <SkDark className="h-4 w-36" />
          </div>
        </div>
      </section>

      {/* hero image */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Sk className="-mt-1 aspect-[16/9] w-full rounded-b-2xl" />
      </div>

      {/* body + sidebar */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Sk className="h-5 w-full" />
            <Sk className="h-5 w-5/6" />
            <Sk className="h-5 w-full" />
            <Sk className="h-5 w-4/6" />
            <Sk className="mt-2 aspect-[16/9] w-full rounded-xl" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Sk key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Sk className="h-4 w-32" />
              <Sk className="mt-2 h-6 w-40" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Sk key={i} className="h-10 rounded-md" />
                ))}
              </div>
              <Sk className="mt-4 h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
