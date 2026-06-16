import type { SpecificationGroup, VehicleSpecifications as VehicleSpecificationsType } from "@/types/automobile";
import { BatteryCharging, Bike, CarFront, Gauge, ShieldCheck, Sofa, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DisplayRow = readonly [string, string];

type DisplayGroup = {
  title: string;
  description?: string;
  tone: string;
  icon: LucideIcon;
  rows: DisplayRow[];
};

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  return "";
}

function objectRows(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value)
    .map(([label, rowValue]) => [label, displayValue(rowValue)] as const)
    .filter(([, rowValue]) => rowValue && rowValue !== "Not applicable");
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

function mergeGroups(groups: DisplayGroup[]) {
  const merged = new Map<string, DisplayGroup>();

  groups.forEach((group) => {
    if (!group.rows.length) return;
    const key = normalize(group.title);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, group);
      return;
    }

    const existingLabels = new Set(existing.rows.map(([label]) => normalize(label)));
    const missingRows = group.rows.filter(([label]) => !existingLabels.has(normalize(label)));
    if (missingRows.length) {
      existing.rows = [...existing.rows, ...missingRows];
    }
  });

  return Array.from(merged.values());
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
  const fallbackGroups: DisplayGroup[] = [
    {
      title: "Engine and transmission",
      tone: "bg-emerald-100 text-emerald-900",
      icon: Gauge,
      rows: objectRows(specifications.engine),
    },
    {
      title: "Dimensions and capacity",
      tone: "bg-blue-100 text-blue-900",
      icon: CarFront,
      rows: objectRows(specifications.dimensions),
    },
    {
      title: "Interior specification",
      tone: "bg-violet-100 text-violet-900",
      icon: Sofa,
      rows: objectRows(specifications.interior),
    },
    {
      title: "Exterior specification",
      tone: "bg-lime-100 text-lime-900",
      icon: Sparkles,
      rows: objectRows(specifications.exterior),
    },
    {
      title: "Safety specification",
      tone: "bg-amber-100 text-amber-900",
      icon: ShieldCheck,
      rows: objectRows(specifications.safety),
    },
    {
      title: "EV battery and charging",
      tone: "bg-cyan-100 text-cyan-900",
      icon: BatteryCharging,
      rows: objectRows(specifications.ev),
    },
    {
      title: "Commercial and permit details",
      tone: "bg-orange-100 text-orange-900",
      icon: Truck,
      rows: objectRows(specifications.commercial),
    },
    {
      title: "Two-wheeler details",
      tone: "bg-rose-100 text-rose-900",
      icon: Bike,
      rows: objectRows(specifications.bike),
    },
  ];
  const icons = [Gauge, CarFront, Sofa, Sparkles, ShieldCheck, BatteryCharging, Truck, Bike];
  const tones = [
    "bg-emerald-100 text-emerald-900",
    "bg-blue-100 text-blue-900",
    "bg-violet-100 text-violet-900",
    "bg-lime-100 text-lime-900",
    "bg-amber-100 text-amber-900",
    "bg-cyan-100 text-cyan-900",
    "bg-orange-100 text-orange-900",
    "bg-rose-100 text-rose-900",
  ];
  const dynamicGroups = specificationGroups
    .map((group, index): DisplayGroup => ({
      title: group.title,
      description: group.description,
      icon: icons[index % icons.length] ?? Sparkles,
      tone: tones[index % tones.length] ?? "bg-emerald-100 text-emerald-900",
      rows: Array.isArray(group.fields)
        ? group.fields.filter((field) => field.value && field.value !== "Not applicable")
            .map((field) => [field.label, displayValue(field.value)] as const)
            .filter(([, value]) => value)
        : [],
    }))
    .filter((group) => group.rows.length > 0);
  const visibleGroups = mergeGroups([...dynamicGroups, ...fallbackGroups]);

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
        const Icon = group.icon ?? icons[index] ?? Sparkles;
        const rows = group.rows;
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
              <span className={`rounded-full px-3 py-1 text-xs font-black ${group.tone}`}>
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
