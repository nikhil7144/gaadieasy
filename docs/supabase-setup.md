# Supabase Setup

Follow these steps when moving the automobile platform from seed fallback to real Supabase data.

## 1. Create Or Open Supabase Project

In Supabase, create a project for this platform.

From Project Settings > API, copy:

- Project URL
- anon public key
- service_role key

Keep the service role key private. It is server-only.

## 2. Create `.env.local`

In the project root, create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Restart the dev server after changing `.env.local`.

## 3. Run Migrations

Open Supabase SQL Editor and run the SQL contents of these files in this order.

Important: do not paste the file path into Supabase. Open the file in VS Code, select all SQL text inside it, copy it, then paste that SQL into Supabase SQL Editor.

```txt
supabase/migrations/20260523000100_automobile_foundation.sql
supabase/migrations/20260525000100_city_default_rto_id.sql
supabase/migrations/20260525000200_storage_buckets.sql
```

The second migration is safe even if the column already exists.

## 4. Seed Starter Data

Run:

```txt
supabase/seed.sql
```

This creates starter data for:

- categories
- brands
- states, cities and RTO offices
- models and variants
- variant/media photos
- storage buckets for vehicle photos, logos, hero banners, SEO images and private documents
- tax, RTO and insurance rules
- dealers and dealer-brand-city mappings
- offers
- SEO page
- comparison page

The seed uses UUIDs because the database schema uses UUID primary keys.

## 5. Start Local App

```bash
cmd /c npm run dev
```

## 6. Verify Public APIs

Open these URLs:

```txt
http://localhost:3000/api/public/brands
http://localhost:3000/api/public/models
http://localhost:3000/api/public/variants
http://localhost:3000/api/public/locations
http://localhost:3000/api/public/media?modelId=00000000-0000-4000-8000-000000000501&variantId=00000000-0000-4000-8000-000000000601
http://localhost:3000/api/public/pricing?brand=hyundai&model=creta&variant=sx-optional-diesel-at&city=bangalore
```

Expected pricing result:

- brand: Hyundai
- model: Creta
- variant: SX Optional Diesel AT
- city: Bengaluru
- dealer: Greenline Hyundai Bengaluru
- dealer offers visible in the response

## 7. Important Behavior

The code now tries Supabase first through `lib/repositories/vehicle-data.ts`.

If env variables are missing, or required DB rows are not present, the app falls back to `lib/data.ts` so local UI does not break.

Once Supabase is verified, the next implementation slice should remove in-memory lead behavior by writing leads to `vehicle_leads`.

## 8. Next Slice

After setup, implement:

- `POST /api/public/leads` writes to Supabase
- admin leads API reads from Supabase
- dealer leads API reads assigned leads from Supabase
- admin CRUD APIs persist brands, models, variants, media, offers, SEO and comparisons
