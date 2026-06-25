# Pricing Cache Architecture Plan

## Goal
Eliminate `getVehicleDataSet()` (~7MB Supabase egress) on every on-road price page render.
Replace with a 2-tier system: pre-computed DB cache (Tier 1) and on-demand fallback (Tier 2).

---

## Architecture

### Tier 1 — `vehicle_pricing_cache` table
One row per `(variant_id, city_id)`. Computed once, served as a single 2KB query.

```
variant_id | city_id | ex_showroom | road_tax | registration_fee | insurance |
smart_card_fee | number_plate_fee | hypothecation_fee | fastag_fee |
handling_charges | offer_discount | on_road_total | computed_at
```

### Tier 2 — Fallback
Current pricing logic in `lib/services/pricing/index.ts`. Used only on cache miss.
After computing, writes result back to cache. Next visitor gets Tier 1.

---

## On-Road Price Page Flow (target state)

```
User visits /on-road-price?variant=curvv-ev&city=mumbai
    ↓
Resolve variant_id + city_id from slugs (targeted query, ~1KB)
    ↓
Query vehicle_pricing_cache WHERE variant_id=? AND city_id=?
    ↓
Cache HIT?
  YES → targeted queries for display data only:
        - variant + model + brand (JOIN, ~2KB)
        - city + state + rto (~1KB)
        - sibling variants list (~5KB)
        - batch pricing for siblings from vehicle_pricing_cache (~5KB)
        - dealer for brand × city (~1KB)
        - offers for model × city (~1KB)
        Total: ~15KB egress instead of 7MB ✅
  NO  → Tier 2:
        - load getVehicleDataSet() (7MB)
        - calculateOnRoadPriceFromData()
        - write result to vehicle_pricing_cache
        - return result
        (next visitor gets cache hit path)
```

---

## Cache Invalidation Events

| Event | Action |
|---|---|
| New variant created | Hook in `createVariant` → compute & cache for all existing cities (50 inserts) |
| New city added | Lazy Tier 2 fill — first user per variant triggers write-back |
| Variant price updated | Delete that variant's cache rows → Tier 2 refill |
| Variant deleted | Delete that variant's cache rows (CASCADE or explicit) |
| Tax rule created/updated | Delete cache rows for all cities in that state → Tier 2 refill |
| RTO charges updated | Delete cache rows for that city → Tier 2 refill |
| Insurance rule updated | Delete all cache rows → Tier 2 refill |

---

## Implementation Status

### ✅ Done
- [x] `vehicle_pricing_cache` table created in Supabase
- [x] `lib/services/pricing-cache/index.ts` — getCachedPricing, batchGetCachedPricing, setCachedPricing, batchSetCachedPricing, invalidateCacheForVariant, invalidateCacheForState
- [x] `app/api/admin/pricing-cache/route.ts` — backfill all variants × cities
- [x] `components/admin/PricingCacheBackfill.tsx` — admin button to trigger backfill
- [x] `updateVariant` invalidation — deletes cache rows when ex_showroom_price changes
- [x] `deleteVariant` invalidation — deletes cache rows
- [x] `updateTaxRule` invalidation — deletes state's cache rows
- [x] `createTaxRule` invalidation — deletes state's cache rows
- [x] Backfill executed — 30,650 rows (613 variants × 50 cities) pre-computed

### ❌ Not Done (critical — current implementation is wrong order)

#### 1. On-road price page — cache checked AFTER getVehicleDataSet() (wrong)
**Current (wrong):**
```ts
const data = await getVehicleDataSet();          // 7MB — always runs
const pricing = await calculateOnRoadPriceWithCache(params, data);  // cache checked here, too late
```
**Required:**
- Check cache BEFORE calling getVehicleDataSet()
- On cache hit: use targeted Supabase queries for display data only
- On cache miss: fall through to getVehicleDataSet() + compute + write cache

#### 2. `createVariant` hook missing
When a new variant is created, the cache should immediately be filled for all existing cities.
Currently: new variant always hits Tier 2 until a user visits that variant × each city combination.
**Required:** After `createVariant` succeeds, compute and insert pricing rows for all cities.

---

## Files To Change (pending work)

### `app/on-road-price/page.tsx`
- Remove `getVehicleDataSet()` from the top-level flow
- Add slug → ID resolution via targeted query
- Check `vehicle_pricing_cache` first
- On hit: use targeted display queries (`getVariantDisplayData`)
- On miss: Tier 2 path with `getVehicleDataSet()`

### `lib/repositories/vehicle-data.ts` (new function)
```ts
export async function getVariantDisplayData(variantId: string, cityId: string)
```
Returns: brand, model, variant, city, state, rto, dealer, offer, sibling variants
Used only on cache hit path. Does NOT fetch pricing tables.

### `lib/services/admin-catalog/index.ts` — `createVariant`
After insert, compute pricing for all cities and bulk-upsert to `vehicle_pricing_cache`.

---

## Egress Comparison

| Scenario | Before | After (target) |
|---|---|---|
| Cache hit (warm) | 7MB | ~15KB |
| Cache miss (cold/new) | 7MB | 7MB (same, Tier 2) |
| New variant created | — | 50 rows written (one-time) |
| Tax rule change | — | State rows deleted, lazy refill |
| Daily at 28 renders | 198MB | ~420KB |
