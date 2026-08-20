// Backfills vehicle_variants.compare_summary from the existing specifications blob.
//
// Run ONCE after applying supabase/migrations/20260820000100_variant_compare_summary.sql,
// and BEFORE deploying the code that reads compare_summary. Safe to re-run — it is a
// pure re-derivation, not an accumulation.
//
//   npm run backfill:compare-summary
//
// Reads .env.local for NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

// Imports the app's own derivation via Node type-stripping, so backfilled rows and rows
// written by the admin hooks can never drift apart. Requires --experimental-strip-types
// (see the "backfill:compare-summary" npm script).
const { deriveCompareSummary } = await import(
  pathToFileURL(path.join(root, "lib", "services", "variant-summary.ts")).href
);

const res = await fetch(`${url}/rest/v1/vehicle_variants?select=id,specifications`, { headers });
if (!res.ok) {
  console.error("Failed to read variants:", res.status, (await res.text()).slice(0, 300));
  process.exit(1);
}
const variants = await res.json();
console.log(`Deriving compare_summary for ${variants.length} variants...`);

let ok = 0;
let failed = 0;
for (const variant of variants) {
  const summary = deriveCompareSummary(variant.specifications ?? undefined);
  const patch = await fetch(`${url}/rest/v1/vehicle_variants?id=eq.${variant.id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ compare_summary: summary }),
  });
  if (patch.ok) {
    ok += 1;
  } else {
    failed += 1;
    console.error(`  ${variant.id}: ${patch.status} ${(await patch.text()).slice(0, 160)}`);
  }
}
console.log(`\nDone. updated=${ok} failed=${failed}`);
if (failed) process.exit(1);
