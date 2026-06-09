import type { SpecificationGroup, VehicleSpecifications as VehicleSpecificationsType } from "@/types/automobile";
import { CarFront, Gauge, ShieldCheck, Sofa, Sparkles } from "lucide-react";

type SpecGroup = {
  title: string;
  tone: string;
  rows?: Record<string, string>;
};

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function objectRows(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : undefined;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

export function VehicleSpecifications({
  specifications,
  specificationGroups = [],
}: {
  specifications: VehicleSpecificationsType;
  specificationGroups?: SpecificationGroup[];
}) {
  const highlights = stringList(specifications.highlights);
  const features = stringList(specifications.features);
  const groups: SpecGroup[] = [
    { title: "Engine and transmission", tone: "bg-emerald-100 text-emerald-900", rows: objectRows(specifications.engine) },
    { title: "Dimensions and capacity", tone: "bg-blue-100 text-blue-900", rows: objectRows(specifications.dimensions) },
    { title: "Interior specification", tone: "bg-violet-100 text-violet-900", rows: objectRows(specifications.interior) },
    { title: "Exterior specification", tone: "bg-lime-100 text-lime-900", rows: objectRows(specifications.exterior) },
    { title: "Safety specification", tone: "bg-amber-100 text-amber-900", rows: objectRows(specifications.safety) },
  ].filter((group) => group.rows && Object.values(group.rows).some(Boolean));
  const icons = [Gauge, CarFront, Sofa, Sparkles, ShieldCheck];
  const dynamicGroups = specificationGroups
    .map((group) => ({
      ...group,
      fields: Array.isArray(group.fields)
        ? group.fields.filter((field) => field.value && field.value !== "Not applicable")
        : [],
    }))
    .filter((group) => group.fields.length > 0);
  const visibleGroups = dynamicGroups.length ? dynamicGroups : groups;

  return (
    <div className="space-y-6">
      {highlights.length ? (
        <div className="overflow-hidden rounded-lg border border-emerald-100 bg-slate-950 p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-lime-300">Variant highlights</p>
              <h2 className="text-xl font-black">What stands out</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div className="rounded-lg bg-white/10 p-3 text-sm font-bold text-emerald-50" key={highlight}>
                {highlight}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {visibleGroups.map((group, index) => {
        const Icon = icons[index] ?? Sparkles;
        const rows = "fields" in group
          ? group.fields.map((field) => [field.label, field.value] as const)
          : Object.entries(group.rows ?? {});
        if (!rows.length) return null;
        return (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={group.title}>
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-lime-300 to-transparent" />
            <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Specification</p>
                  <h2 className="text-xl font-black text-slate-950">{group.title}</h2>
                  {"description" in group && group.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
                  ) : null}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${"tone" in group ? group.tone : "bg-emerald-100 text-emerald-900"}`}>
                Specs
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3" key={label}>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{labelize(label)}</div>
                  <div className="mt-1 text-base font-semibold leading-6 text-slate-900">{value}</div>
                </div>
              ))}
            </div>
            </div>
          </section>
        );
      })}

      {features.length ? (
      <section>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Comfort and features</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((feature) => (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800" key={feature}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
