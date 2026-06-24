# Gaadieasy Codebase Reference

> Read this before writing any code. It describes how this project is structured, how data flows, naming conventions, and patterns every file follows.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (v16+, Turbopack) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Storage | Supabase Storage (`vehicle-media` bucket) |
| Styling | Tailwind CSS |
| Deployment | Vercel (Mumbai region `bom1`) |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` |
| Icons | `lucide-react` |

---

## Directory Structure

```
automobile-platform/
├── app/                        # Next.js App Router pages + API routes
│   ├── layout.tsx              # Root layout — SiteHeader, SiteFooter, globals
│   ├── page.tsx                # Homepage
│   ├── on-road-price/          # Main pricing calculator page (URL params driven)
│   ├── discover/               # Vehicle discovery / browse
│   ├── vehicle-updates/        # Vehicle stories (storyType = vehicle_story)
│   │   └── [brand]/[model]/    # Individual story page
│   ├── brand-updates/          # Brand news (storyType = brand_update)
│   │   └── [brand]/[slug]/     # Individual brand update page
│   ├── brands/[brand]/         # Brand listing + overview sub-page
│   ├── category/[type]/        # Category landing
│   ├── city/[slug]/            # City price page (SEO)
│   ├── compare/[slug]/         # Vehicle comparison page
│   ├── experiences/            # User experience feed + write form
│   ├── emi-calculator/         # Standalone EMI tool
│   ├── photos/                 # Vehicle photos gallery
│   ├── admin/                  # Platform admin (auth-gated layout)
│   │   ├── layout.tsx          # Auth check → AdminShell or login
│   │   ├── brands/             # Manage brands
│   │   ├── models/             # Manage models
│   │   ├── variants/           # Manage variants + media upload
│   │   ├── tax-rules/          # State tax rules
│   │   ├── rto-charges/        # RTO charges per city
│   │   ├── insurance/          # Insurance rules
│   │   ├── dealers/            # Dealer showrooms
│   │   ├── homepage-banners/   # Hero promotions
│   │   ├── comparisons/        # Comparison pages
│   │   ├── city-pages/         # City landing pages
│   │   ├── vehicle-updates/    # Vehicle stories admin
│   │   ├── offers/             # Offers
│   │   └── leads/              # Lead management
│   ├── dealer/                 # Dealer portal (separate auth)
│   ├── adminuser/              # Admin user setup page
│   └── api/
│       ├── admin/              # Admin mutation endpoints (POST/PATCH/DELETE)
│       ├── dealer/             # Dealer portal endpoints
│       └── public/             # Read-only public endpoints (used by client components)
│
├── components/
│   ├── admin/                  # Admin UI — all "Manager" components + AdminShell
│   ├── dealer/                 # Dealer portal UI
│   ├── public/                 # Public-facing interactive components
│   └── shared/                 # SiteHeader, SiteFooter, Skeleton, etc.
│
├── lib/
│   ├── repositories/
│   │   └── vehicle-data.ts     # THE central data loader — fetches all 20 tables
│   ├── services/
│   │   ├── admin-catalog/      # All admin CRUD operations (variants, models, brands…)
│   │   ├── pricing/            # On-road price calculation engine
│   │   ├── discovery/          # Tab/filter logic for vehicle browse
│   │   ├── public-data/        # Shapes data for homepage/public API
│   │   ├── comparisons/        # Comparison page DB reads
│   │   ├── reviews/            # vehicle_reviews table
│   │   ├── vehicle-stories/    # vehicle_stories + vehicle_story_updates
│   │   ├── experiences/        # experiences table
│   │   ├── media/              # vehicle_media queries
│   │   ├── leads/              # Lead creation + assignment
│   │   ├── city-pages/         # City page reads
│   │   ├── seo/                # SEO page reads
│   │   ├── dealer-auth/        # Dealer login/session
│   │   ├── dealer-offers/      # Dealer-created offers
│   │   ├── admin-offers/       # Platform offers
│   │   └── promotions/         # Hero promotions
│   ├── auth/
│   │   ├── admin.ts            # isPlatformAdmin(user) — checks app_metadata.role
│   │   └── require-admin.ts    # requirePlatformAdmin() — guard for API routes
│   ├── supabase/
│   │   ├── admin.ts            # createSupabaseAdminClient() — service role key
│   │   ├── server.ts           # createServerSupabaseClient() — cookie-based SSR
│   │   └── client.ts           # Browser Supabase client
│   ├── utils/
│   │   ├── format.ts           # formatIndianPrice, formatShortPrice, slugify
│   │   └── emi.ts              # EMI calculation
│   ├── validations/
│   │   ├── admin.ts            # Zod schemas for admin mutations
│   │   └── lead.ts             # Zod schema for lead submission
│   └── data.ts                 # Static seed data (fallback when DB is empty)
│
├── types/
│   └── automobile.ts           # ALL domain types — single source of truth
│
├── middleware.ts               # Bot blocking, geo-block (India only), rate limiting
├── vercel.json                 # Region: bom1 (Mumbai)
└── supabase/migrations/        # SQL migration files
```

---

## Data Architecture

### The Central Repository — `getVehicleDataSet`

**File:** `lib/repositories/vehicle-data.ts`

This is the most important file in the project. It fetches all 20 database tables in a single `Promise.all` and returns a `VehicleDataSet` object. Every public page and most services consume this.

```
getVehicleDataSet()          ← React cache() — deduplicates within one request
  └── fetchVehicleDataSet()  ← 20 parallel Supabase queries
        └── Returns VehicleDataSet (categories, brands, models, variants,
            media, states, cities, rtoOffices, taxRules, rtoCharges,
            insuranceRules, gstRules, registrationFeeRules, dealerBusinesses,
            dealers, dealerUsers, dealerBrandMappings, offers, heroPromotions, cityPages)
```

**Critical rules:**
- Wrapped in React `cache()` — NOT `unstable_cache`. This means it deduplicates within a request (generateMetadata + page body share one fetch) but does NOT cache across requests.
- The dataset is ~2MB+ — `unstable_cache` was tried and silently failed (Next.js 2MB limit). Do not put this back in `unstable_cache`.
- Falls back to `seedDataSet` (from `lib/data.ts`) when DB returns empty brands/models/variants/cities.
- Uses service role key via `createSupabaseAdminClient()`.

### Two Supabase Clients — Never Confuse Them

| Client | File | Key | Use for |
|---|---|---|---|
| `createSupabaseAdminClient()` | `lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB reads/writes, bypasses RLS |
| `createServerSupabaseClient()` | `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth checks — reads session cookie |
| Browser client | `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side auth state |

Both `createSupabaseAdminClient()` and `createServerSupabaseClient()` return `null` if env vars are missing — always null-check.

### Tables Not In `getVehicleDataSet` (fetched separately)

These tables are queried directly, not through the central dataset:

| Table | Service | Notes |
|---|---|---|
| `vehicle_reviews` | `lib/services/reviews/index.ts` | Per-model, cached with `unstable_cache` 60s |
| `vehicle_stories` | `lib/services/vehicle-stories/index.ts` | Filtered by `storyType`: `vehicle_story` or `brand_update` |
| `vehicle_story_updates` | admin-catalog | Timeline updates per story |
| `vehicle_story_media` | admin-catalog | Gallery images per story |
| `experiences` | `lib/services/experiences/index.ts` | User-written buying experiences |
| `comparison_pages` | `lib/services/comparisons/` | Vehicle comparison pages |
| `seo_pages` | `lib/services/seo/index.ts` | SEO landing pages |

---

## Page → Data Call Map

| Page | Data source | Notes |
|---|---|---|
| `/` (homepage) | `getPublicHomepageDataForApi()` + `getHomepageComparisons()` | Pulls from VehicleDataSet |
| `/on-road-price` | `getVehicleDataSet()` + `getReviewsForModel()` | Driven by `?brand=&model=&variant=&city=` params |
| `/discover` | `getVehicleDataSet()` via public API | Client-side filter with server data |
| `/vehicle-updates` | `getVehicleStories({ type: "vehicle_story" })` | Separate from brand updates |
| `/vehicle-updates/[brand]/[model]` | `getVehicleStories()` | Single story by slug |
| `/brand-updates/[brand]/[slug]` | `getVehicleStories({ type: "brand_update" })` | Brand-scoped news |
| `/brands/[brand]` | `getVehicleDataSet()` | Filters by brand slug |
| `/city/[slug]` | `getVehicleDataSet()` | Filters by city slug |
| `/compare/[slug]` | `lib/services/comparisons/db.ts` | Direct DB query |
| `/experiences` | `lib/services/experiences/index.ts` | Paginated |
| `/emi-calculator` | Static + client-side only | No server data |
| `/photos` | `getVehicleDataSet()` | Media filtered client-side |
| `/admin/*` | Direct DB via admin-catalog service | No dataset cache |

---

## Admin Architecture

### Auth Flow

```
/admin/* request
  └── app/admin/layout.tsx
        └── createServerSupabaseClient().auth.getUser()
              ├── No user → show AdminLoginForm
              ├── User but not platform_admin → show access-blocked screen
              └── isPlatformAdmin(user) === true → render AdminShell + page
```

`isPlatformAdmin` checks: `user.app_metadata.role === "platform_admin"` (set in Supabase Auth admin panel).

### Admin API Route Pattern

Every admin API route follows this exact pattern:

```typescript
export async function POST/PATCH/DELETE(request: Request) {
  // 1. Auth guard
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;   // returns 401/403 JSON

  // 2. Validate input with Zod
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "...", issues: ... }, { status: 400 });

  // 3. Call service function
  try {
    return Response.json({ result: await serviceFunction(parsed.data) });
  } catch (error) {
    console.error("[METHOD /api/admin/...] error:", JSON.stringify(error));
    const message = error instanceof Error ? error.message
      : (error !== null && typeof error === "object" && "message" in error)
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
```

**Supabase errors are plain objects, not `instanceof Error`** — always check for `.message` property on objects.

### Admin Client-Side Pattern

Admin Manager components (e.g. `AdminVariantsManager`) use `admin-form-utils.ts` helpers:

```typescript
// components/admin/admin-form-utils.ts
postAdminJson(url, body)    // POST
patchAdminJson(url, body)   // PATCH
deleteAdminJson(url, body)  // DELETE — body in DELETE request, parsed with request.json()
```

All use `sendAdminJson` which:
1. Sends with `Content-Type: application/json`
2. Parses response as JSON
3. Throws `new Error(payload.error || \`HTTP \${response.status}: ...\`)` on non-ok — note `||` not `??` (empty string fallback matters)

---

## Service Layer Patterns

### admin-catalog (`lib/services/admin-catalog/index.ts`)

All admin CRUD lives here. Key patterns:

- Always uses `getAdminClient()` which calls `createSupabaseAdminClient()` and throws if null
- Maps DB rows with `mapBrand`, `mapModel`, `mapVariant`, etc. (snake_case → camelCase)
- Calls `revalidatePath("/", "layout")` after mutations to bust ISR cache
- **Delete operations** check FK blockers first, then clean up dependent tables before deleting the parent row

**`deleteVariant` cascade order:**
1. Count check on `vehicle_leads` and `comparison_pages` (block if linked)
2. Delete from `hero_promotions`
3. Delete from `vehicle_media`
4. Unlink `vehicle_reviews` (set `variant_id = null` — best-effort, non-blocking)
5. Delete from `vehicle_variants`

**`deleteModel` cascade order:**
1. Count check on `vehicle_leads` (block if linked)
2. Delete storage files
3. Delete from `comparison_pages`
4. Delete from `offers`, `hero_promotions`, `vehicle_stories`, `vehicle_media`, `vehicle_variants`
5. Delete from `vehicle_models`

**Count queries:** Use `.select("id", { count: "exact" }).eq(...).limit(0)` — NOT `{ head: true }`. HEAD requests in PostgREST return empty response bodies on error, causing Supabase to create errors with empty `.message`.

### Pricing Service (`lib/services/pricing/index.ts`)

`calculateOnRoadPriceFromData(params, data)` — takes URL params `{ brand, model, variant, city }` (all slugs) and the VehicleDataSet. Returns `PricingResult` with full `PriceBreakdown`.

Breakdown components:
- Ex-showroom price
- GST (from `gstRules` by vehicleClass)
- Road tax (from `taxRules` by state+category+fuelType, falls back to hardcoded state table)
- Registration/RTO fees (from `rtoCharges` by city, falls back to `registrationFeeRules` by vehicleClass)
- Insurance (from `insuranceRules` by category+fuelType)
- Offer discount (from `offers` filtered by model/variant/city)

### Vehicle Stories vs Brand Updates

Both use the same `vehicle_stories` table and `VehicleStory` type. Separated by `storyType` field:
- `"vehicle_story"` → shows on `/vehicle-updates`
- `"brand_update"` → shows on `/brand-updates`

**These are separate URL namespaces and must NEVER be mixed.** The admin page creates both types but the `storyType` field controls which feed they appear in.

---

## Type System

**Single source of truth:** `types/automobile.ts` — all domain types live here. Never define domain types inline in components or services.

Key types and their DB table:

| Type | Table |
|---|---|
| `VehicleCategory` | `vehicle_categories` |
| `Brand` | `brands` |
| `VehicleModel` | `vehicle_models` |
| `VehicleVariant` | `vehicle_variants` |
| `VehicleMedia` | `vehicle_media` |
| `VehicleSpecifications` | JSON column in `vehicle_variants.specifications` |
| `SpecificationGroup` | JSON column in `vehicle_variants.specification_groups` |
| `State` | `states` |
| `City` | `cities` |
| `StateTaxRule` | `state_tax_rules` |
| `RtoCharge` | `rto_charges` |
| `InsuranceRule` | `insurance_rules` |
| `GstRule` | `gst_rules` |
| `Dealer` | `dealers` |
| `DealerBusiness` | `dealer_businesses` |
| `Offer` | `offers` |
| `HeroPromotion` | `hero_promotions` |
| `CityPage` | `city_pages` |
| `ComparisonPage` | `comparison_pages` |
| `VehicleStory` | `vehicle_stories` |
| `VehicleStoryUpdate` | `vehicle_story_updates` |
| `VehicleLead` | `vehicle_leads` |

### DB Column Naming

All DB columns are `snake_case`. All TypeScript fields are `camelCase`. Every mapper function handles the translation.

Example — `vehicle_variants`:
- `model_id` → `modelId`
- `ex_showroom_price` → `exShowroomPrice`
- `fuel_type` → `fuelType`
- `is_default` → `isDefault`
- `specification_groups` → `specificationGroups`

`comparison_pages` columns: `v1_variant_id`, `v2_variant_id`, `v3_variant_id` (NOT `vehicle_1_variant_id` — the migration file is wrong, the actual DB uses the short names).

---

## Middleware (`middleware.ts`)

Runs on all routes except static assets. Order matters:

1. **Skip admin** — `/admin` and `/api/admin` bypass everything (auth handled by `requirePlatformAdmin`)
2. **Bot blocklist** → 403 (serpstatbot, ahrefsbot, semrushbot, etc.)
3. **Geo-block** — non-India requests (`x-vercel-ip-country !== "IN"`) → 403, except search engine bots (googlebot, bingbot, etc.)
4. **Skip prefetch** — `Next-Router-Prefetch: 1` header bypasses rate limit
5. **Rate limit** — 120 req/min per IP via Upstash Redis, fail-open if Redis unavailable, 429 returns JSON

---

## Component Patterns

### Server vs Client Components

- All `app/*/page.tsx` files are **async server components** — they await data then pass to client components
- Interactive components (`use client`) receive data as props from their page
- Admin Manager components are all client components — they call API routes for mutations

### Admin Manager Component Pattern

Each admin section has one large client component (`AdminXxxManager.tsx`) that:
- Receives initial data as props from the server page
- Manages all form state locally with `useState`
- Calls `postAdminJson`/`patchAdminJson`/`deleteAdminJson` for mutations
- Calls `router.refresh()` after success to reload server data
- Shows errors inline (never swallows them)
- Uses `adminFieldClass` from `admin-form-utils.ts` for consistent input styling

### Style Conventions

- Tailwind utility classes — no CSS modules, no styled-components
- `adminFieldClass` constant for all admin form inputs
- Color palette: slate (neutrals), emerald/lime (success/primary), red (danger), indigo (secondary actions), amber (warnings)
- Font weight: `font-black` for headings/labels, `font-bold` for secondary text, `font-medium` for body
- Spacing: `gap-3` for form fields, `gap-6` for sections, `p-4` for card padding
- Borders: `rounded-lg border border-slate-200` for cards, `rounded-md border border-slate-200` for inputs

---

## Caching Strategy

| What | How | TTL |
|---|---|---|
| `getVehicleDataSet` | React `cache()` | Per-request (no cross-request cache) |
| `getReviewsForModel` | `unstable_cache` | 60 seconds |
| `getVehicleStories` | `unstable_cache` | 60 seconds |
| Admin pages | No cache — always fresh | — |
| After any mutation | `revalidatePath("/", "layout")` | Immediate ISR bust |

**Do not use `unstable_cache` for anything approaching 2MB.** Next.js silently drops the cache write with a console error.

---

## Environment Variables

| Variable | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server + browser auth clients | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client (bypasses RLS) | Yes for admin/writes |
| `UPSTASH_REDIS_REST_URL` | Rate limiter in middleware | Optional (fail-open) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiter in middleware | Optional (fail-open) |

---

## Known Constraints & Gotchas

1. **Supabase errors are not `instanceof Error`** — they are plain objects with `{ message, code, details, hint }`. Always check both `instanceof Error` and `"message" in error`.

2. **HEAD requests lose error bodies** — never use `{ head: true }` in count queries. Use `.select("id", { count: "exact" }).limit(0)` instead.

3. **`??` vs `||` for error messages** — use `||` when the fallback should also cover empty string `""`. Supabase can return errors with empty `message`.

4. **`vehicle_leads.variant_id` is NOT NULL** — cannot delete a variant that has leads. Must deactivate the variant instead, or remove leads first.

5. **`comparison_pages.vehicle_1_variant_id` and `vehicle_2_variant_id` are NOT NULL FKs** — variant deletion is blocked if referenced by a comparison page.

6. **`Next-Router-Prefetch: 1`** — Next.js App Router fires 10–15 prefetch requests per page load. Rate-limit logic must skip this header or real users get 429s.

7. **`vercel.json` sets region `bom1` (Mumbai)** — serverless functions run in India. Do not change unless intentional.

8. **`vehicle_stories` is split by `storyType`** — `vehicle_story` = `/vehicle-updates`, `brand_update` = `/brand-updates`. Never show brand updates on vehicle-updates page.

9. **`getVehicleDataSet` fetches 20 tables** — ~2MB response. Any new tables added to this dataset push toward the limit. Keep separate tables separate.

10. **Admin auth requires `app_metadata.role = "platform_admin"`** — set via Supabase Dashboard Auth panel, not the public API.
