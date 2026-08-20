import type { VariantCompareSummary, VehicleSpecifications } from "@/types/automobile";

// Single source of truth for deriving a variant's compare summary. Used by the write
// hooks in admin-catalog (so every create/update keeps the column current) and by
// scripts/backfill-compare-summary.mjs (so existing rows get one). If the compare table
// or the discovery search index starts reading a new spec field, add it here and re-run
// the backfill — otherwise the field will silently be missing on browse surfaces.

function section(specs: VehicleSpecifications | undefined, name: string): Record<string, unknown> {
  const value = specs?.[name];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function pick(specs: VehicleSpecifications | undefined, paths: Array<[string, string]>): string | undefined {
  for (const [name, key] of paths) {
    const value = section(specs, name)[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function deriveCompareSummary(specs: VehicleSpecifications | undefined): VariantCompareSummary {
  const commercialValues = Object.values(section(specs, "commercial")).filter(
    (value): value is string => typeof value === "string",
  );

  return {
    // Path lists mirror VehicleCompareModal's getSpecValue() calls exactly.
    payload: pick(specs, [["commercial", "payload"], ["commercial", "payloadCapacity"]]),
    loadCapacity: pick(specs, [
      ["commercial", "payload"],
      ["commercial", "payloadCapacity"],
      ["commercial", "loadingCapacity"],
      ["commercial", "loadCapacity"],
      ["commercial", "cargoCapacity"],
    ]),
    battery: pick(specs, [["ev", "batteryCapacity"], ["ev", "battery"]]),
    power: pick(specs, [["engine", "power"], ["bike", "power"], ["commercial", "power"]]),
    // VehicleDiscoverClient.getPower() parses a number out of this one.
    maxPower: pick(specs, [["engine", "maxPower"], ["bike", "power"], ["commercial", "power"]]),
    safety: pick(specs, [["safety", "rating"], ["safety", "airbags"], ["safety", "abs"]]),
    highlights: stringList(specs?.highlights),
    features: stringList(specs?.features),
    commercialText: commercialValues.length ? commercialValues.join(" ") : undefined,
  };
}
