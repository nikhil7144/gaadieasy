# GaadiGear — Architecture & Implementation Spec
### (Accessories/Parts/Riding-Gear Marketplace inside Gaadieasy.com)

> This is the original architecture spec provided at the start of the GaadiGear project. It's kept here as a permanent reference. **It does not reflect the current implementation** — see `GAADIGEAR_PLAN.md` for what was actually decided and built, including every place this spec's assumptions turned out to be wrong (e.g. `vehicle_type`/`segment` didn't exist as separate columns, cache refresh uses application-level hooks not cron/triggers, table names got a `gear_` prefix, seller account model mirrors the dealer precedent instead of a flat `user_id` link). When the two disagree, `GAADIGEAR_PLAN.md` is authoritative for what's live; this file is authoritative for the original intent.

---

## 0. Design Principles (why things are structured this way)

1. **Read-heavy, write-light system.** Buyers browsing >> sellers writing. So every read path must be servable from a *denormalized/cached* table, never a live join across `vehicles`, `brands`, `products`, `pricing`.
2. **Compatibility is many-to-many, not a foreign key.** A product can fit one model, a whole brand, a whole segment (adventure/cruiser/SUV/pickup), a whole vehicle type (all cars), or be fully universal. Model this as a mapping table, not a column on `products`.
3. **Category is a fixed shallow tree, not a free-text field.** Sellers pick from a controlled taxonomy — this is what makes filtering fast and admin moderation possible.
4. **"What it is" (category) is separate from "what it fits" (compatibility) and separate again from "which vehicle type it's relevant to."** Car perfume, truck perfume, and bike phone-mounts are not three categories — they're one category each ("Air Fresheners", "Phone Mounts") scoped to different vehicle types via compatibility. This is the key fix for a multi-vehicle-type marketplace: it stops your category tree from exploding into duplicates like "Car Mats" / "Truck Mats" / "Bike Mats".
5. **EV is an attribute, not a vehicle type.** An EV car is still a car; an EV bike is still a bike. Powertrain (petrol/diesel/CNG/electric) lives as a field on `vehicle_models`/`vehicle_variants`, not as a sibling of Car/Bike/Truck in the type hierarchy. Otherwise you'd need to duplicate every category and compatibility rule for "EV Car" vs "Car."
6. **Every listing surface (vehicle page widget, GaadiGear PLP, search) reads from the same pre-joined "catalog index" table** — you maintain one cache-rebuild pipeline, not five.
7. **Cursor pagination everywhere**, not `OFFSET` — offset pagination is what quietly kills Supabase egress/CPU once catalogs grow.

---

## 1. Taxonomy / Hierarchy

### 1.1 Vehicle Types (top of the compatibility hierarchy — NOT part of the category tree)

```
vehicle_types
 ├── Two Wheeler (bike/scooter)
 ├── Car
 ├── Commercial Vehicle (truck, pickup, bus, tempo)
 └── Three Wheeler (optional, if you list autos/e-rickshaws)
```

Powertrain (`petrol / diesel / cng / electric`) is a **field on `vehicle_models`/`vehicle_variants`**, not a vehicle type — an EV car is still a `Car`, an EV bike is still a `Two Wheeler`. This keeps categories and compatibility rules from duplicating per powertrain.

### 1.2 Category tree (shared across vehicle types, admin-managed)

The category tree stays **one tree**, not one-per-vehicle-type. What changes per vehicle type is which categories are *relevant* (tagged via `applicable_vehicle_types`) and what a product in that category is *compatible with* (via the compatibility table in §2.1). This avoids duplicate categories like "Car Mats" / "Truck Mats" / "Bike Mats" — you get one "Mats & Protection" category, scoped per product.

```
Category (L1 - fixed, admin-managed)              applicable_vehicle_types
 ├── Parts                                         [bike, car, commercial]
 │    ├── Engine Parts
 │    ├── Brake Parts
 │    ├── Electricals & Battery
 │    ├── Suspension
 │    ├── Filters & Fluids
 │    └── Body Parts
 ├── Interior & Comfort                             [car, commercial]
 │    ├── Seat Covers
 │    ├── Mats & Liners
 │    ├── Air Fresheners & Perfumes
 │    ├── Organizers & Storage
 │    └── Sunshades
 ├── Exterior & Styling                             [car, commercial, bike]
 │    ├── Body Wrap / Decals
 │    ├── Alloy Wheels & Covers
 │    ├── Mud Flaps & Guards
 │    └── Lighting (LED bars, fog lamps)
 ├── Bike Accessories                                [bike]
 │    ├── Crash Guards & Protection
 │    ├── Luggage & Touring (panniers, top box, tank bags)
 │    ├── Windshields & Visors
 │    ├── Seats & Comfort
 │    └── Styling & Cosmetic
 ├── Riding Gear                                     [bike]
 │    ├── Helmets
 │    ├── Jackets
 │    ├── Gloves
 │    ├── Riding Pants
 │    ├── Boots
 │    └── Base Layers / Rain Gear
 ├── Riding & Travel Accessories                     [bike, car, commercial]
 │    ├── Communication (intercoms, headsets)
 │    ├── Action Cameras & Mounts
 │    ├── Tools & Puncture/Emergency Kits
 │    └── Bags & Backpacks
 ├── Electronics & Charging                          [bike, car, commercial]  -- e.g. "universal" category
 │    ├── Chargers & Cables
 │    ├── Dash Cams
 │    ├── GPS & Mobile Mounts
 │    └── Inverters & Power Banks
 ├── Fleet & Compliance                              [commercial]
 │    ├── Reflective Tape & Safety Signage
 │    ├── Fire Extinguishers & First Aid
 │    ├── GPS Fleet Trackers
 │    └── Tarpaulins & Load Covers
 └── Care & Maintenance                              [bike, car, commercial]
      ├── Cleaning & Detailing
      ├── Covers (body/dust)
      └── Lubricants & Care Kits
```

`applicable_vehicle_types` is a column on `categories` (array or join table) — used only to decide **which categories to show as filter options** when a buyer/seller has selected a given vehicle type. It does not decide fit; fit is decided by compatibility (below).

**Three independent classification axes on every product:**

| Axis | Values | Purpose |
|---|---|---|
| `category_id` | from tree above | what it *is* |
| `compatibility` (see §2.1) | Global / Vehicle-type / Segment / Brand / Model / Variant | what it *fits* |
| `usage_tags[]` (Riding Gear / Travel Accessories) | Touring, Track, Off-road, Daily Commute, Rain, Night-riding, Long-haul | how buyers filter within a category |

Compatibility is deliberately **not** a single foreign key, and it is **layered** — a phone charger can be "fits all Cars & Commercial Vehicles", a jacket can be "Universal" for bikes, a crash guard can be "KTM Duke 390/250 only", a seat cowl can be "RE Himalayan + RE Scram (segment: adventure bikes)", and truck mud-flaps can be "fits all Commercial Vehicles, Tata & Ashok Leyland only."

---

## 2. Database Schema (Postgres/Supabase)

### 2.1 Core seller & catalog tables

```sql
-- Sellers (accessory brands/manufacturers, distinct from vehicle "dealers")
create table sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),  -- links to Supabase Auth for login
  business_name text not null,
  brand_name text,                  -- storefront display name
  business_type text,               -- individual / proprietorship / partnership / pvt_ltd
  gstin text,
  pan text,
  kyc_status text default 'pending_review', -- pending_review / verified / rejected
  kyc_rejection_reason text,
  contact_email text,
  contact_phone text,
  logo_url text,
  status text default 'onboarding', -- onboarding / active / suspended
  commission_pct numeric default 10,
  created_at timestamptz default now()
);

create table seller_kyc_documents (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers(id) on delete cascade,
  doc_type text not null,   -- 'gst_certificate' / 'pan_card' / 'cancelled_cheque' / 'address_proof'
  file_url text not null,
  uploaded_at timestamptz default now()
);

create table seller_bank_details (
  seller_id uuid primary key references sellers(id),
  account_holder text,
  account_number_enc text,   -- encrypted at rest
  ifsc text,
  upi_id text,
  payout_cycle text default 'weekly' -- weekly / biweekly / monthly
);

-- Accessory brand master (KTM PowerParts, Rynox, Studds, generic sellers, etc.)
create table accessory_brands (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers(id), -- null if platform-owned/generic
  name text not null,
  logo_url text,
  is_oem boolean default false -- true = official manufacturer brand (KTM PowerParts)
);

-- Fixed category tree (admin managed, NOT seller editable)
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  level int not null, -- 1 or 2
  applicable_vehicle_types uuid[] default '{}', -- FKs to vehicle_types; empty = shown for all types
  sort_order int default 0,
  is_active boolean default true
);

-- Vehicle types: top of the compatibility hierarchy (separate from vehicle_brands/models
-- which you already have). EV/petrol/diesel is a field on vehicle_models, NOT a type here.
create table vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,        -- 'Two Wheeler', 'Car', 'Commercial Vehicle', 'Three Wheeler'
  slug text unique not null
);
-- Assumes your existing vehicle_brands / vehicle_models tables each carry a
-- vehicle_type_id FK, and vehicle_models carries a `segment` field
-- (e.g. adventure/cruiser/naked for bikes, hatchback/sedan/suv for cars,
-- pickup/heavy-truck/bus for commercial) and a `powertrain` field
-- (petrol/diesel/cng/electric).

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers(id) not null,
  brand_id uuid references accessory_brands(id),
  category_id uuid references categories(id) not null,
  title text not null,
  slug text unique not null,
  description text,
  mrp numeric not null,               -- MRP, GST-inclusive (as displayed to buyer)
  selling_price numeric not null,     -- selling price, GST-inclusive (as displayed to buyer)
  gst_rate numeric not null default 18,   -- e.g. 18, 12, 5 (percent)
  hsn_code text,                       -- required for GST invoicing
  stock_qty int default 0,
  sku text,
  images jsonb default '[]',        -- array of urls
  attributes jsonb default '{}',    -- {material, weight, waterproof, sizes:[...]}
  usage_tags text[] default '{}',   -- ['touring','off-road']
  status text default 'draft',      -- draft / pending_review / live / rejected / paused
  rating_avg numeric default 0,
  rating_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_category_status on products(category_id, status);
create index idx_products_seller on products(seller_id);

-- Compatibility mapping (the core of "show relevant products on model page")
-- One product can have MULTIPLE rows here — e.g. a charger that fits
-- "all Cars" AND "all Commercial Vehicles" gets two rows, one per vehicle_type.
create table product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,

  compatibility_type text not null,
  -- 'global'        -> fits everything, any vehicle_type (rare: e.g. generic microfiber cloth)
  -- 'vehicle_type'  -> fits all vehicles of one type (e.g. "any Car")
  -- 'segment'       -> fits a segment within a type (e.g. "any SUV", "any Adventure bike")
  -- 'brand'         -> fits all models of one vehicle brand (e.g. "any Maruti")
  -- 'model'         -> fits one specific model, all variants (e.g. "Duke 390")
  -- 'variant'       -> fits one specific variant/trim only (e.g. "Duke 390 BS6, top trim")

  vehicle_type_id uuid references vehicle_types(id),     -- required for all types except 'global'
  segment text,                                          -- required only for compatibility_type='segment'
  vehicle_brand_id uuid references vehicle_brands(id),   -- required for 'brand' and below
  vehicle_model_id uuid references vehicle_models(id),   -- required for 'model' and below
  vehicle_variant_id uuid references vehicle_variants(id), -- required only for 'variant'

  -- computed specificity for ranking (more specific match = shown higher/first on a model page)
  specificity_level int generated always as (
    case compatibility_type
      when 'global' then 0
      when 'vehicle_type' then 1
      when 'segment' then 2
      when 'brand' then 3
      when 'model' then 4
      when 'variant' then 5
    end
  ) stored
);

create index idx_compat_model on product_compatibility(vehicle_model_id);
create index idx_compat_brand on product_compatibility(vehicle_brand_id);
create index idx_compat_type_vt on product_compatibility(compatibility_type, vehicle_type_id);
create index idx_compat_segment on product_compatibility(vehicle_type_id, segment);

-- Variants (size/color for riding gear)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  size text,
  color text,
  additional_price numeric default 0,
  stock_qty int default 0,
  sku_suffix text
);
```

### 2.2 Orders, Shipments (seller-fulfilled delivery), & Payouts

Since **sellers handle their own delivery** (not platform logistics) and **payment is collected centrally via the payment gateway**, an order needs to split into one "shipment" per seller — each with its own shipping fee, GST breakdown, and payout share. A single buyer order can contain items from 3 different sellers; each becomes its own row in `gear_order_shipments` with independent status/tracking.

```sql
create table gear_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id),
  status text default 'placed', -- placed/confirmed/partially_shipped/shipped/delivered/cancelled
  items_subtotal numeric,        -- sum of all items, GST-inclusive
  shipping_total numeric,        -- sum of all sellers' shipping fees for this order
  grand_total numeric,           -- items_subtotal + shipping_total (what buyer actually pays)
  payment_gateway_ref text,      -- Razorpay/Stripe/PayU order/payment id
  payment_status text default 'pending', -- pending/paid/failed/refunded
  shipping_address jsonb,
  created_at timestamptz default now()
);

-- One row per seller within an order = one shipment, since each seller ships independently
create table gear_order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references gear_orders(id) on delete cascade,
  seller_id uuid references sellers(id),
  items_subtotal numeric,          -- this seller's items only, GST-inclusive
  shipping_fee numeric,            -- computed from this seller's shipping rule at checkout
  gst_amount numeric,              -- for invoicing (derived from items' gst_rate)
  commission_amount numeric,       -- platform commission — charged on items_subtotal only, NOT on shipping_fee
  seller_payout_amount numeric,    -- items_subtotal - commission_amount + shipping_fee (shipping passes through in full)
  shipment_status text default 'placed', -- placed/packed/shipped/out_for_delivery/delivered/cancelled/returned
  courier_name text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create table gear_order_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references gear_order_shipments(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  qty int not null,
  unit_price numeric not null,     -- GST-inclusive, price at time of purchase (snapshot)
  gst_rate numeric not null,       -- snapshot from product at time of purchase
  gst_amount numeric not null      -- computed: unit_price * qty * gst_rate/(100+gst_rate)
);

create table seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers(id),
  period_start date,
  period_end date,
  total_shipments int,
  gross_items_amount numeric,
  gross_shipping_amount numeric,
  commission_amount numeric,
  net_payout numeric,              -- gross_items_amount - commission_amount + gross_shipping_amount
  status text default 'pending',   -- pending/processing/paid
  paid_at timestamptz
);
```

**Why commission excludes the shipping fee:** the seller bears the actual courier cost, so the shipping fee they charge the buyer should pass through to them in full. Platform commission is calculated only on `items_subtotal` (which itself is GST-inclusive — decide up front whether your commission % is applied on GST-inclusive or GST-exclusive value; GST-exclusive is more standard for marketplace commission agreements, so: `commission_amount = (items_subtotal - gst_amount) * commission_pct / 100`).

**Payment flow:** buyer pays `grand_total` once, via the platform's payment gateway (Razorpay/Cashfree/PayU, whichever you use) — funds settle to the platform's account — `seller_payouts` are computed on a cycle (weekly/biweekly, per `seller_bank_details.payout_cycle`) and paid out via bank transfer/UPI, net of commission. Sellers never touch the payment gateway directly — this also means a single failed/refunded payment is a platform-side reversal, not something each seller has to individually process.

### 2.3 Seller-managed shipping (PAN-India, seller fulfils delivery)

Keep this simple in v1 — a flat rule per seller, with an optional exclusion list for genuinely hard-to-serve areas (islands, far Northeast), not a full pincode/zone matrix. You can add zone-level granularity later without breaking this shape.

```sql
create table seller_shipping_settings (
  seller_id uuid primary key references sellers(id),
  ships_pan_india boolean default true,
  excluded_states text[] default '{}',       -- rare exceptions, e.g. {'Andaman and Nicobar Islands'}
  excluded_pincodes text[] default '{}',      -- rare individual exclusions
  fee_type text default 'flat',               -- 'flat' | 'free' | 'threshold'
  flat_fee numeric default 0,                 -- used when fee_type = 'flat'
  free_shipping_above numeric,                -- used when fee_type = 'threshold' (free above this order value)
  standard_delivery_days int default 5,
  cod_available boolean default false,
  updated_at timestamptz default now()
);
```

**Checkout-time logic (per seller, per cart):**
1. Check buyer's pincode against `excluded_pincodes`/`excluded_states` for that seller — if excluded, that seller's items are flagged non-deliverable at checkout (buyer must remove them or split order).
2. Compute `shipping_fee` for that seller's item group:
   - `fee_type='free'` → 0
   - `fee_type='flat'` → `flat_fee`
   - `fee_type='threshold'` → 0 if seller's `items_subtotal >= free_shipping_above`, else `flat_fee`
3. Each seller's shipping fee becomes one line in `gear_order_shipments.shipping_fee`; buyer sees a per-seller breakdown in the cart before payment, and one combined `grand_total` at final checkout.

This mirrors real marketplaces (Amazon/Flipkart-style "sold by X, shipped by X") — cleanest mental model for both buyers and sellers, and keeps `product_compatibility`/`gear_catalog_index` completely untouched by shipping logic (shipping is resolved only at cart/checkout time, never on browse/PLP pages — so it doesn't add read-path cost).

### 2.4 The critical piece — read-optimized cache tables

This is what solves your egress problem. **Never join `products` + `product_compatibility` + `categories` + `vehicle_models` live on every page view.**

```sql
-- (A) Flat search/listing index — rebuilt via trigger/queue on product publish/update
create table gear_catalog_index (
  product_id uuid primary key references products(id),
  title text,
  slug text,
  category_l1 text,
  category_l2 text,
  brand_name text,
  seller_name text,
  price numeric,
  mrp numeric,
  rating_avg numeric,
  thumbnail_url text,
  usage_tags text[],

  compatible_vehicle_type_ids uuid[],  -- e.g. [car_id, commercial_id] for a universal charger
  compatible_segments text[],          -- e.g. ['suv','sedan'] or ['adventure']
  compatible_brand_ids uuid[],
  compatible_model_ids uuid[],
  compatible_variant_ids uuid[],
  compatibility_max_specificity int,   -- highest specificity_level across this product's rows

  status text,
  updated_at timestamptz
);

create index idx_catalog_vtype_gin on gear_catalog_index using gin(compatible_vehicle_type_ids);
create index idx_catalog_segment_gin on gear_catalog_index using gin(compatible_segments);
create index idx_catalog_model_gin on gear_catalog_index using gin(compatible_model_ids);
create index idx_catalog_brand_gin on gear_catalog_index using gin(compatible_brand_ids);
create index idx_catalog_search on gear_catalog_index using gin(to_tsvector('english', title));

-- (B) Per-vehicle-model precomputed "recommended gear" widget (top N, ready to render)
create table model_gear_cache (
  vehicle_model_id uuid primary key references vehicle_models(id),
  top_products jsonb,   -- [{product_id,title,price,thumbnail_url,slug}, ...] max ~12
  updated_at timestamptz default now()
);
```

**Matching rule used ONLY inside the background refresh job** (never on the buyer request path) to decide which products belong on a given model's cache row. For a `vehicle_models` row with `id=M`, `brand_id=B`, `vehicle_type_id=T`, `segment=S`, a product matches if **any** of its `product_compatibility` rows satisfy:

```
compatibility_type = 'global'
OR (compatibility_type = 'vehicle_type' AND vehicle_type_id = T)
OR (compatibility_type = 'segment'      AND vehicle_type_id = T AND segment = S)
OR (compatibility_type = 'brand'        AND vehicle_brand_id = B)
OR (compatibility_type = 'model'        AND vehicle_model_id = M)
OR (compatibility_type = 'variant'      AND vehicle_model_id = M)   -- shown at model level too, variant-filtered on PDP
```
Ranked by `specificity_level desc` so a "Duke 390-specific" crash guard shows above a "fits all KTM bikes" one, which shows above a "fits all Two Wheelers" charger.

**Refresh strategy:**
- On product insert/update/publish → a Postgres trigger (or a queue job, e.g. `pg_cron` / Supabase Edge Function) upserts the row into `gear_catalog_index`.
- `model_gear_cache` is rebuilt asynchronously (every N minutes via `pg_cron`, or on-demand invalidation when a compatible product changes) — vehicle pages read **one row**, not a query.
- This mirrors the cache-table pattern you already use for vehicle on-road pricing — same philosophy, applied to gear.
- A change to a `vehicle_type`/`brand`/`segment`-level product (rare, but touches many models at once) triggers a bulk async rebuild of all affected `model_gear_cache` rows — batched, off the request path.

---

## 3. API Structure

### 3.1 Seller-side APIs

```
POST   /api/seller/auth/signup
POST   /api/seller/auth/login
GET    /api/seller/me                        -- profile + kyc_status
PUT    /api/seller/me
PUT    /api/seller/bank-details
GET    /api/seller/shipping-settings
PUT    /api/seller/shipping-settings          -- ships_pan_india, exclusions, fee_type, flat_fee, etc.

GET    /api/seller/products?status=&page=&cursor=
POST   /api/seller/products                  -- create (status=draft)
PUT    /api/seller/products/:id
POST   /api/seller/products/:id/submit        -- draft -> pending_review
DELETE /api/seller/products/:id

POST   /api/seller/products/:id/variants
PUT    /api/seller/products/:id/variants/:vid

GET    /api/seller/orders?status=&page=&cursor=
PUT    /api/seller/orders/:item_id/status     -- ship/confirm etc (per order_item)

GET    /api/seller/payouts?page=&cursor=
GET    /api/seller/dashboard/summary          -- reads a precomputed materialized view, not live aggregation
```

### 3.2 Admin APIs (moderation layer — important, don't skip)

```
GET    /api/admin/sellers?status=pending
PUT    /api/admin/sellers/:id/approve
GET    /api/admin/products?status=pending_review
PUT    /api/admin/products/:id/approve        -- pending_review -> live (triggers cache upsert)
PUT    /api/admin/products/:id/reject
GET    /api/admin/categories                  -- CRUD for taxonomy, seller can't touch this
```

### 3.3 Buyer-side APIs

```
GET /api/gaadigear                             -- landing: vehicle-type tiles, then category tiles (cached, static-ish)
GET /api/gaadigear/vehicle-types               -- Car / Bike / Commercial (cache forever)
GET /api/gaadigear/categories?vehicle_type=car -- taxonomy filtered by applicable_vehicle_types (cache forever, invalidate on admin edit)

GET /api/gaadigear/filters
    ?vehicle_type=car&category=interior-comfort&model_id=xxx
    -- returns available filter facets + counts (brands[], price_min/max, usage_tags[], segments[])
    -- computed with a single aggregate query over gear_catalog_index (already flat + indexed,
    -- so this stays cheap even as a "live" query — no separate cache table needed for v1;
    -- add one later only if facet queries start showing up in slow-query logs)

GET /api/gaadigear/products
    ?vehicle_type=car
    &category=interior-comfort
    &subcategory=air-fresheners
    &model_id=xxx                    -- OR brand_id, OR segment=suv
    &brand_id=&usage=&price_min=&price_max=
    &sort=popularity|price_asc|price_desc
    &cursor=<last_id>
    &limit=24
    -- ALL filtering happens server-side against gear_catalog_index; the frontend never
    -- fetches unfiltered data and filters client-side. Filter state lives in the URL query
    -- string (shareable/bookmarkable links, and lets Next.js/SSR cache per filter combo).

GET /api/gaadigear/products/:slug              -- single PDP, one row + variants join (cheap, PK lookup)

GET /api/vehicle/:model_id/recommended-gear     -- reads model_gear_cache row directly, no joins
                                                 -- (vehicle_type is implicit from the model itself)

GET /api/gaadigear/search?q=&vehicle_type=&cursor=   -- to_tsvector search on gear_catalog_index,
                                                       -- vehicle_type is an optional narrowing filter

POST /api/gear-cart/items
GET  /api/gear-cart                             -- returns items grouped by seller, with per-seller
                                                 -- shipping_fee already resolved (pincode known from
                                                 -- buyer profile/address) — buyer sees full breakdown
                                                 -- before checkout, not just at payment step
POST /api/gear-cart/check-serviceability?pincode= -- flags any seller/items not deliverable to that pincode
POST /api/gear-orders/checkout                  -- creates gear_orders + one gear_order_shipments row
                                                 -- per seller + gear_order_items, then hands off to
                                                 -- payment gateway; splits into per-seller order_items server-side
GET  /api/gear-orders/:id
```

**Key rule:** every buyer-facing GET above touches **one table** (`gear_catalog_index` or `model_gear_cache`), never a live 4-way join. Joins only happen in the background job that maintains those cache tables.

---

## 4. Page / Flow Structure

### 4.1 Seller flow
```
Landing Page (/gaadigear/sell)
  → "Why sell with us" + commission info + CTA
  → Signup (business details, GSTIN, category interest)
  → KYC pending screen
  → [Admin approves]
  → Seller Dashboard
       ├── Overview (sales summary, pending orders count — from cached summary)
       ├── Products
       │     ├── List (draft/live/rejected tabs)
       │     └── Add/Edit Product Wizard:
       │           Step 1: Category (L1 → L2 dropdown, fixed taxonomy)
       │           Step 2: Compatibility (repeatable - a product can have several rows):
       │                     a) Pick Vehicle Type(s): Car / Bike / Commercial Vehicle (multi-select,
       │                        e.g. a charger can target both Car AND Commercial Vehicle)
       │                     b) Per selected type, pick scope: All vehicles of this type /
       │                        Specific segment (SUV, Adventure, Pickup...) / Specific brand(s) /
       │                        Specific model(s) / Specific variant(s)
       │                     c) "List on all vehicle types (fully universal)" checkbox as a
       │                        shortcut for compatibility_type='global'
       │           Step 3: Details (title, description, attributes by category)
       │           Step 4: Variants (size/color) if riding gear
       │           Step 5: Pricing & stock
       │           Step 6: Images
       │           Step 7: Review → Submit for approval
       ├── Orders (per order_item, status update, shipping label)
       ├── Payouts (cycle history, next payout date, statements)
       └── Settings (bank details, brand logo, notification prefs)
```

### 4.2 Buyer flow
```
Entry point A: Vehicle Model Page (organic Google search landing)
  → "Recommended Gear for [KTM Duke 390]" widget (from model_gear_cache)
  → click "View all" → GaadiGear PLP pre-filtered by model_id

Entry point B: Direct GaadiGear hub (/gaadigear)
  → Step 1: Vehicle Type tiles (Car / Bike / Commercial Vehicle) → sets context for everything after
  → Step 2: Category tiles, filtered to that type (e.g. Car shows Interior & Comfort,
            Exterior & Styling, Electronics & Charging, Parts, Care; Bike shows Riding Gear,
            Bike Accessories, etc.) → "Universal" categories like Electronics & Charging
            appear under every type
  → Filter bar: Model picker, Brand picker, Segment (SUV/Sedan/Adventure/etc.), Usage tags, Price range
  → PLP (cursor-paginated grid, 24/page)
  → PDP → Add to cart → variant select
  → Cart (grouped by seller, for shipping/payout logic) → Checkout
  → Order confirmation → Order tracking page
```

### 4.3 Site structure — where GaadiGear sits, and page-by-page layout

**GaadiGear is a standalone section (`/gaadigear`), not a tab inside a vehicle page** — it has its own nav entry, its own landing page, its own URL space (`/gaadigear/*`) — but it's surfaced in two places so it's never isolated from the vehicle-research traffic that's your main funnel:

```
Site-wide top nav:
  [New Cars] [New Bikes] [Compare] [GaadiGear] [Dealers] ...
                                     ^^^^^^^^^
                                     own nav item, own URL space /gaadigear/*
```

**1. Vehicle Model Page — embedded widget (not the full marketplace)**
```
/cars/tata-nexon  (or /bikes/ktm-duke-390)
┌───────────────────────────────────────────┐
│ [existing content: specs, on-road price,  │
│  variants, images, dealer enquiry form]   │
├───────────────────────────────────────────┤
│  Recommended Gear for Tata Nexon      →   │   <- section header + "View all" link
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐             │
│  │img │ │img │ │img │ │img │  (4-6 cards)│   <- reads model_gear_cache, one row, no joins
│  │₹price│ │₹price│ ...                    │
│  └────┘ └────┘ └────┘ └────┘             │
│         "View all 24 products →"         │   <- links to /gaadigear/products?model_id=X
├───────────────────────────────────────────┤
│ [rest of existing vehicle page content]   │
└───────────────────────────────────────────┘
```
This widget is a horizontal scroll/grid of 4-6 top items, placed after the core specs/pricing block (where buyer intent is warmest) — not at the very top, so it doesn't compete with the primary reason they landed (spec/price lookup).

**2. GaadiGear landing page — section by section**
```
/gaadigear
┌───────────────────────────────────────────┐
│  Hero: "Gear up for your ride"            │
│  [ Car ]  [ Bike ]  [ Commercial ]         │   <- vehicle_type tiles (step 1 of buyer flow)
├───────────────────────────────────────────┤
│  Shop by Category                         │
│  [Parts] [Interior] [Riding Gear] [...]   │   <- category tiles, filtered once a
│                                           │      vehicle_type is picked (or shown
│                                           │      unfiltered before that)
├───────────────────────────────────────────┤
│  Shop by Your Vehicle                     │
│  [ Search: pick your model ▾ ]            │   <- model search/autocomplete ->
│                                           │      jumps straight to a pre-filtered PLP
├───────────────────────────────────────────┤
│  Featured Brands                          │   <- accessory_brands carousel (Studds,
│                                           │      Rynox, KTM PowerParts, etc.)
├───────────────────────────────────────────┤
│  Trending / Best-selling                  │   <- small curated row, editorially or
│                                           │      rating-driven, from gear_catalog_index
└───────────────────────────────────────────┘
```

**3. GaadiGear PLP** (`/gaadigear/products?...`)
```
┌─────────────────────────────────────────────┐
│ [Search bar]           [Sort ▾]             │
│ Filters (left rail, desktop / top sheet,    │
│ mobile): Vehicle Type · Category · Brand ·  │
│ Model · Segment · Usage · Price range       │
├─────────────────────────────────────────────┤
│ Product grid, 24/page, cursor-paginated     │
│ [card][card][card][card]                    │
│ [card][card][card][card]                    │
├─────────────────────────────────────────────┤
│              Load more / Next               │
└─────────────────────────────────────────────┘
```
All filter state lives in the URL (`?vehicle_type=&category=&model_id=&brand_id=&...`) so links from the vehicle-page widget, from search, and from direct nav all land on the same shareable, cacheable PLP state — this is also why the buyer-side filters are pure query-string-driven API calls (§3.3), not client-managed state.



### 4.4 Seller landing page & signup/login — detailed

**Landing page** (`/gaadigear/sell`) — public, no auth required, purely to convert visiting brands/manufacturers into signups:

```
┌───────────────────────────────────────────┐
│ Hero: "Sell your accessories to           │
│ [X lakh] vehicle owners every month"      │
│ [ Start Selling → ]                       │
├───────────────────────────────────────────┤
│ Why sell here (3-4 plain rows, not cards) │
│  · Get placed on the exact model page     │
│    a buyer is already looking at          │
│  · We handle payments — you handle        │
│    delivery                               │
│  · Weekly payouts, transparent commission │
│  · Simple dashboard, no listing fees      │
├───────────────────────────────────────────┤
│ How it works (3 numbered steps)           │
│  1. Sign up & get verified (1-2 days)     │
│  2. List your products                    │
│  3. Get orders — we collect payment,      │
│     you ship, we pay you out weekly       │
├───────────────────────────────────────────┤
│ Categories you can sell in                │
│  [Parts] [Interior] [Riding Gear] [...]   │  <- plain text chips, links to category list
├───────────────────────────────────────────┤
│ Commission & fees (transparent, one line) │
│  "X% commission per order, no listing     │
│   fee, no fee on shipping you collect"    │
├───────────────────────────────────────────┤
│ FAQ (plain accordion, 4-6 questions)      │
├───────────────────────────────────────────┤
│ [ Start Selling → ]  (repeat CTA)         │
└───────────────────────────────────────────┘
```

**Signup flow** — a short wizard, not one giant form (sellers abandon long forms):

```
Step 1 — Account
  Email, phone, password (or "Continue with Google")
  → creates auth.users row (Supabase Auth) + a linked `sellers` row (status='onboarding')
  → OTP sent to phone/email for verification

Step 2 — Business details
  Business name, brand/storefront name, business type
  (individual / proprietorship / partnership / pvt ltd), GSTIN, PAN

Step 3 — What will you sell
  Multi-select from L1 categories (Parts / Interior / Riding Gear / etc.)
  → not binding, just routes review priority + pre-fills dashboard suggestions

Step 4 — KYC documents
  Upload: GST certificate, PAN card, cancelled cheque (or bank proof)
  → stored via seller_kyc_documents

Step 5 — Bank details
  Account holder, account number, IFSC, UPI (optional) → seller_bank_details
  (can also be deferred to Settings, but collecting upfront avoids a stalled
  payout later when the seller forgets to come back and fill this in)

Step 6 — Review & submit
  → sellers.status stays 'onboarding', kyc_status='pending_review'
  → Confirmation screen: "We're reviewing your application — typically
    approved within 1-2 business days. We'll email you."
```

Admin approves via `PUT /api/admin/sellers/:id/approve` (§3.2) → `kyc_status='verified'`, `status='active'` → seller gets an email/notification and can now log in to a live dashboard instead of a pending screen.

**Login flow:**
```
/gaadigear/sell/login
  Email/phone + password  (or OTP-based login)
  → Supabase Auth session created
  → check linked sellers row:
      status='onboarding', kyc_status='pending_review'  → show "Application under review" screen
      status='onboarding', kyc_status='rejected'         → show rejection reason + "Resubmit documents" flow
      status='active'                                    → redirect to Seller Dashboard
      status='suspended'                                 → show suspension notice + support contact
```

**Auth notes for Claude Code:**
- Sellers authenticate through the same Supabase Auth as buyers, but are a distinct **role** — `sellers.user_id` links one `auth.users` row to one seller account. Don't reuse the buyer session/account model for seller dashboards; check role on every protected seller route (middleware/guard), not just at login.
- Forgot-password is standard Supabase Auth reset-by-email — no custom logic needed beyond redirecting to the right dashboard post-reset based on role.
- One person could in principle be both a buyer and a seller contact — that's fine, since the seller identity lives in a separate `sellers` row keyed off the same `user_id`, not a mutually-exclusive account type.

**API additions:**
```
POST /api/seller/auth/signup            -- step 1, creates auth user + sellers row
POST /api/seller/auth/verify-otp
POST /api/seller/auth/login
POST /api/seller/auth/forgot-password
POST /api/seller/auth/reset-password
PUT  /api/seller/onboarding/business-details   -- step 2
PUT  /api/seller/onboarding/categories         -- step 3
POST /api/seller/onboarding/kyc-documents      -- step 4
PUT  /api/seller/onboarding/bank-details       -- step 5
POST /api/seller/onboarding/submit             -- step 6, flips to pending_review
GET  /api/seller/onboarding/status             -- for the pending/rejected/active screens above
```

---

## 5. Refund & Payout Eligibility Flow

**Rule as specified:** buyer can raise a refund within 3 days of delivery. If no refund is raised in that window, the seller's payout for that shipment becomes eligible. Payouts run weekly.

### 5.1 Schema additions

```sql
alter table gear_order_shipments
  add column payout_hold_until timestamptz generated always as (delivered_at + interval '3 days') stored,
  add column payout_status text default 'not_delivered',
  -- not_delivered / holding / on_hold_refund / eligible / paid / excluded
  add column payout_id uuid references seller_payouts(id);

create table gear_refund_requests (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references gear_order_shipments(id),
  buyer_id uuid references auth.users(id),
  reason_category text,   -- 'defective','wrong_item','damaged','not_as_described','changed_mind'
  reason_note text,
  status text default 'requested',  -- requested / approved / rejected / refunded
  requested_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid,                 -- admin user id
  admin_notes text,
  refund_amount numeric,            -- total approved refund (items, +shipping if applicable)
  refund_shipping boolean default false,
  gateway_refund_ref text           -- refund txn id from payment gateway
);

-- Supports partial refund (specific items/qty within a multi-item shipment)
create table gear_refund_request_items (
  id uuid primary key default gen_random_uuid(),
  refund_request_id uuid references gear_refund_requests(id) on delete cascade,
  order_item_id uuid references gear_order_items(id),
  qty int not null,
  refund_amount numeric not null
);

-- Enforce the 3-day window at the DB layer too, not just in the API
create or replace function enforce_refund_window() returns trigger as $$
declare v_delivered_at timestamptz;
begin
  select delivered_at into v_delivered_at from gear_order_shipments where id = new.shipment_id;
  if v_delivered_at is null then
    raise exception 'Cannot raise a refund before the shipment is marked delivered';
  end if;
  if now() > v_delivered_at + interval '3 days' then
    raise exception 'Refund window (3 days from delivery) has expired for this shipment';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_enforce_refund_window
before insert on gear_refund_requests
for each row execute function enforce_refund_window();
```

### 5.2 Payout eligibility — the query the weekly job runs against

A shipment becomes eligible when: it's delivered, its 3-day hold has passed, **and** it has no refund request still in an unresolved state (`requested`/`approved`). Note this naturally handles the edge case where admin review of a refund takes longer than 3 days — the shipment stays excluded until the refund is actually resolved, not just until 3 days pass:

```sql
create or replace view payout_eligible_shipments as
select s.*
from gear_order_shipments s
where s.shipment_status = 'delivered'
  and s.payout_id is null
  and now() >= s.payout_hold_until
  and not exists (
    select 1 from gear_refund_requests r
    where r.shipment_id = s.id
      and r.status in ('requested','approved')  -- still unresolved -> keep held
  );
```

### 5.3 Refund lifecycle

```
Delivered → [3-day window open]
  ├── Buyer raises refund request (any point within window)
  │      shipment.payout_status = 'on_hold_refund'  (holds regardless of the 3-day mark)
  │      ├── Admin approves → gateway refund issued → status='refunded'
  │      │      → recompute shipment's items_subtotal/commission/payout figures,
  │      │        subtracting the refunded item(s) amount (and shipping fee, if refund_shipping=true)
  │      │      → if fully refunded, shipment excluded from payout entirely;
  │      │        if partially refunded, remaining balance still becomes payout-eligible
  │      │        once the (already-passed) hold condition is satisfied
  │      └── Admin rejects → status='rejected' → shipment falls back to normal payout eligibility
  └── No refund raised within window
         → payout_hold_until passes → shipment auto-qualifies via the view above
         → included in the next weekly payout run
```

### 5.4 Weekly payout job (e.g. `pg_cron`, every Monday 00:00 IST)

1. `select * from payout_eligible_shipments` grouped by `seller_id`.
2. For each seller: sum `items_subtotal`, `shipping_fee`, `commission_amount` across their eligible shipments → insert one `seller_payouts` row (`status='processing'`).
3. Update those shipments: `payout_id = <new payout id>`, `payout_status = 'paid'`.
4. Hand off `net_payout` amounts to your bank transfer/UPI payout mechanism (e.g. Razorpay Route/RazorpayX, Cashfree Payouts) — on success, `seller_payouts.status='paid'`, `paid_at=now()`.
5. If a payout transfer fails (bad bank details etc.), keep `status='failed'` and surface it in both admin and seller dashboards — don't silently re-attempt without visibility.

### 5.5 API additions

```
-- Buyer
POST /api/gear-orders/:shipment_id/refund-request     -- {reason_category, reason_note, items:[{order_item_id, qty}]}
GET  /api/gear-orders/:shipment_id/refund-request      -- current status

-- Admin
GET  /api/admin/refund-requests?status=requested&cursor=
PUT  /api/admin/refund-requests/:id/approve            -- {refund_amount, refund_shipping}
PUT  /api/admin/refund-requests/:id/reject             -- {admin_notes}
GET  /api/admin/payouts/preview?seller_id=             -- shows what the NEXT run would pay this seller
POST /api/admin/payouts/run                            -- manual trigger (in addition to the pg_cron schedule)

-- Seller
GET  /api/seller/payouts                                -- past payouts (paid)
GET  /api/seller/payouts/upcoming                        -- shipments currently held vs. eligible for next run
                                                          -- (transparency: seller can see WHY something is held —
                                                          -- "in 3-day window" vs "refund pending admin review")
```

**Seller dashboard note:** showing sellers *why* money is held (still in the 3-day window, vs. a refund is pending admin review, vs. already queued for next Monday's run) heads off a large share of seller support tickets — worth building `payouts/upcoming` as a first-class screen, not an afterthought.

---

## 6. GST-Inclusive Pricing — Summary

- Sellers enter `mrp` and `selling_price` as **GST-inclusive**, the way any Indian e-commerce seller expects to (this is what they'll compare against Amazon/other marketplaces).
- Each product also carries `gst_rate` (5/12/18/28%) and `hsn_code` (mandatory for GST-compliant invoices) — the seller selects `gst_rate` from a dropdown tied to their product's HSN, not free text.
- At order time, `gst_amount` is derived and snapshotted onto `gear_order_items`: `gst_amount = unit_price * qty * gst_rate / (100 + gst_rate)`. This is what lets you generate a proper tax invoice per order/shipment later without recomputing from live product data (products can change price after the order).
- Platform commission is calculated on the GST-exclusive item value, not the GST-inclusive price the buyer sees — keeps your commission agreements with sellers clean and standard.
- The buyer only ever sees one number per product (GST-inclusive price) and one combined `grand_total` at checkout (items + shipping) — no surprise tax line at payment, consistent with how Indian buyers expect online pricing to work.

---

## 7. Admin Panel — Design Direction (product listing & moderation)

You asked for clean, minimal, list-first — not dashboard-card heavy. Concretely, for Claude Code to build against:

**Layout, not cards:**
- Product moderation/listing screens are a **dense single-column table/list**, not a grid of boxes. Each row: thumbnail (small, ~40px) — title + seller name (two lines, no borders) — category tag (plain text, not a colored pill) — price — stock — status — row-hover reveals inline actions (Approve/Reject/Edit as text links, not buttons).
- No shadow/border-heavy "cards" per item. Use a single hairline divider (`border-b`, 1px, low-contrast gray) between rows — this is what keeps a list of 50 products scannable instead of feeling like 50 separate boxes.
- Status shown as a small colored dot + label text (`● Live`, `● Pending`), not a filled badge/chip — badges read as "busy" at list density.

**Filters, not filter panels:**
- A single row above the table: a plain text search input, and 2-3 plain `<select>`/dropdown filters (Category, Status, Seller) — no sidebar filter panel, no accordion filter groups. This is an internal tool for admins doing repetitive triage, so speed of scanning > discoverability of options.

**Placeholders — minimal, not decorative:**
- Empty states are one line of muted text ("No products match this filter") with a single reset-filters link — no illustration, no big empty-state graphic.
- Input placeholders are literal examples, not generic hints — e.g. `HSN Code` field placeholder is `8708` not `"Enter HSN code"`.

**Pagination:**
- Simple `‹ Prev  1 2 3 … 14  Next ›` row-based pagination for admin lists (admins do jump around), but **cursor pagination under the hood via the API** either way (`GET /api/admin/products?cursor=&limit=`) — the page-number UI can still be built on cursor pages if you fetch cumulative counts once and cache them, or you can genuinely offset-paginate only on the admin side (low traffic, one admin at a time, so offset cost here is negligible — this is the one place in the whole system where `OFFSET` is fine, precisely because it's low-frequency internal use, not buyer-facing).

**Bulk actions:** row checkboxes + one persistent action bar that appears only when rows are selected ("3 selected → Approve / Reject") rather than a permanent toolbar — keeps the default view clutter-free.

This same list-not-cards, dot-not-badge, inline-not-modal philosophy should carry through seller dashboard's Products/Orders/Payouts tables too, for consistency.

---

## 8. Category Seed Data — SQL for Supabase

Run in order: vehicle types → L1 categories → L2 categories → applicable-vehicle-type tagging. Uses slug lookups so you don't need to hand-copy UUIDs.

```sql
-- STEP 1: Vehicle types
insert into vehicle_types (name, slug) values
  ('Two Wheeler', 'two-wheeler'),
  ('Car', 'car'),
  ('Commercial Vehicle', 'commercial-vehicle'),
  ('Three Wheeler', 'three-wheeler');

-- STEP 2: Level 1 categories
insert into categories (name, slug, level, sort_order) values
  ('Parts', 'parts', 1, 1),
  ('Interior & Comfort', 'interior-comfort', 1, 2),
  ('Exterior & Styling', 'exterior-styling', 1, 3),
  ('Bike Accessories', 'bike-accessories', 1, 4),
  ('Riding Gear', 'riding-gear', 1, 5),
  ('Riding & Travel Accessories', 'riding-travel-accessories', 1, 6),
  ('Electronics & Charging', 'electronics-charging', 1, 7),
  ('Fleet & Compliance', 'fleet-compliance', 1, 8),
  ('Care & Maintenance', 'care-maintenance', 1, 9);

-- STEP 3: Level 2 categories, one insert block per parent

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Engine Parts','engine-parts',1),
  ('Brake Parts','brake-parts',2),
  ('Electricals & Battery','electricals-battery',3),
  ('Suspension','suspension',4),
  ('Filters & Fluids','filters-fluids',5),
  ('Body Parts','body-parts',6)
) as v(name, slug, sort_order)
where c.slug = 'parts';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Seat Covers','seat-covers',1),
  ('Mats & Liners','mats-liners',2),
  ('Air Fresheners & Perfumes','air-fresheners-perfumes',3),
  ('Organizers & Storage','organizers-storage',4),
  ('Sunshades','sunshades',5)
) as v(name, slug, sort_order)
where c.slug = 'interior-comfort';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Body Wrap & Decals','body-wrap-decals',1),
  ('Alloy Wheels & Covers','alloy-wheels-covers',2),
  ('Mud Flaps & Guards','mud-flaps-guards',3),
  ('Lighting (LED bars, fog lamps)','lighting-led-fog-lamps',4)
) as v(name, slug, sort_order)
where c.slug = 'exterior-styling';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Crash Guards & Protection','crash-guards-protection',1),
  ('Luggage & Touring','luggage-touring',2),
  ('Windshields & Visors','windshields-visors',3),
  ('Seats & Comfort','seats-comfort',4),
  ('Styling & Cosmetic','styling-cosmetic',5)
) as v(name, slug, sort_order)
where c.slug = 'bike-accessories';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Helmets','helmets',1),
  ('Jackets','jackets',2),
  ('Gloves','gloves',3),
  ('Riding Pants','riding-pants',4),
  ('Boots','boots',5),
  ('Base Layers / Rain Gear','base-layers-rain-gear',6)
) as v(name, slug, sort_order)
where c.slug = 'riding-gear';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Communication','communication',1),
  ('Action Cameras & Mounts','action-cameras-mounts',2),
  ('Tools & Emergency Kits','tools-emergency-kits',3),
  ('Bags & Backpacks','bags-backpacks',4)
) as v(name, slug, sort_order)
where c.slug = 'riding-travel-accessories';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Chargers & Cables','chargers-cables',1),
  ('Dash Cams','dash-cams',2),
  ('GPS & Mobile Mounts','gps-mobile-mounts',3),
  ('Inverters & Power Banks','inverters-power-banks',4)
) as v(name, slug, sort_order)
where c.slug = 'electronics-charging';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Reflective Tape & Safety Signage','reflective-tape-safety-signage',1),
  ('Fire Extinguishers & First Aid','fire-extinguishers-first-aid',2),
  ('GPS Fleet Trackers','gps-fleet-trackers',3),
  ('Tarpaulins & Load Covers','tarpaulins-load-covers',4)
) as v(name, slug, sort_order)
where c.slug = 'fleet-compliance';

insert into categories (parent_id, name, slug, level, sort_order)
select c.id, v.name, v.slug, 2, v.sort_order
from categories c, (values
  ('Cleaning & Detailing','cleaning-detailing',1),
  ('Covers (Body/Dust)','covers-body-dust',2),
  ('Lubricants & Care Kits','lubricants-care-kits',3)
) as v(name, slug, sort_order)
where c.slug = 'care-maintenance';

-- STEP 4: Tag each L1 category with applicable_vehicle_types
-- (empty/omitted = shown for all types, so only non-universal categories need this update)

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('two-wheeler','car','commercial-vehicle')
) where slug = 'parts';

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('car','commercial-vehicle')
) where slug = 'interior-comfort';

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('car','commercial-vehicle','two-wheeler')
) where slug = 'exterior-styling';

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug = 'two-wheeler'
) where slug in ('bike-accessories','riding-gear');

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug in ('two-wheeler','car','commercial-vehicle')
) where slug in ('riding-travel-accessories','electronics-charging','care-maintenance');

update categories set applicable_vehicle_types = (
  select array_agg(id) from vehicle_types where slug = 'commercial-vehicle'
) where slug = 'fleet-compliance';
```

Adjust the L2 category lists/names freely — the structure (L1 insert → L2 insert-by-parent-slug → vehicle-type tagging) is what matters and will hold regardless of exact naming you settle on.

---

## 9. Egress / Query-Cost Optimization Summary

| Problem today | Fix |
|---|---|
| Vehicle page joins vehicle+pricing+tax live | (already being cache-tabled — apply same pattern below) |
| GaadiGear PLP would join products+compat+category+brand live | Read only from `gear_catalog_index` (flat, GIN-indexed) |
| Vehicle page "recommended gear" section | Read `model_gear_cache` — single PK row, JSON blob, zero joins |
| Deep pagination (`OFFSET 5000`) | Cursor pagination using `(updated_at, id)` keyset everywhere |
| Category tree fetched every page load | Cache in CDN/edge (rarely changes) + client-side cache with long TTL |
| Search hitting `products` with `ILIKE` | `to_tsvector` GIN index on `gear_catalog_index.title`, not on live table |
| Admin approving a product | Approval action is what triggers the *only* live join — write path, not read path, so cost is bounded by seller activity, not buyer traffic |
| Seller dashboard summary stats | Precompute via `pg_cron` job into a small `seller_dashboard_summary` table (order counts, revenue, pending payout) refreshed every 15-30 min — dashboard reads one row |

---

## 10. Open questions / info that would sharpen this further

If you can share these, I can tighten the schema and API contracts:
1. Current stack confirmation — Next.js + Supabase (Postgres) + Supabase Auth? Any edge functions already in use?
2. Existing `vehicles`/`vehicle_models`/`vehicle_brands` structure — specifically: do you already store `vehicle_type` (car/bike/commercial), `segment` (SUV/sedan/adventure/pickup), and `powertrain` (petrol/diesel/electric) on these tables today? If yes, I'll map `product_compatibility` FKs to them exactly; if not, those three fields need to be added first since the whole compatibility layer depends on them.
3. Do you already distinguish a "variant" (trim level, e.g. petrol vs diesel, base vs top-spec) as its own table, or is that folded into `vehicle_models` today?
4. Expected catalog scale (rough number of sellers/products in year 1, and roughly what mix across car/bike/commercial) — changes whether Postgres FTS is enough or you'll want Meilisearch/Algolia sooner.
5. Multi-seller cart/checkout — do you want single combined payment split server-side (recommended above), or separate checkout per seller?
6. Do dealers and gear-sellers ever overlap (a vehicle dealer also selling accessories), or are they fully separate account types?

---

## 11. Buyer-Facing Page Design Spec (added 2026-07-08, based on live UI review)

> Unlike sections 0-10 above, this section is **not** part of the original spec provided at project start — it's a later addition, written after reviewing the actual Phase 7 buyer pages live (PDP, cart, checkout, home) and finding them functionally correct but visually/UX-minimal: a working checkout flow, not yet a marketplace someone would trust with a purchase. Treat this as the authoritative reference for what "done" looks like on every buyer-facing page going forward — pull from it instead of re-deriving requirements from scratch each time a page gets revisited.

### What was wrong with the first pass, specifically
- **PDP**: no fitment/compatibility info anywhere, despite that being the platform's core differentiator over a generic marketplace. No reviews/ratings surfaced, no delivery estimator, no trust badges, no "you may also like."
- **Cart & Checkout**: no persistent header/nav at all — a buyer wanting to keep browsing has no way back except the browser back button. No order summary visible during checkout (a buyer commits to an order without seeing what they're buying on that page). "Place order" rendered in a washed-out/disabled-looking state even when it should be clickable — a real conversion killer.
- **Home**: decent skeleton, but sparse — "New arrivals" showed a single orphaned card in an otherwise empty page; no banners, no featured brands, no trending section.

### 11.1 GaadiGear Home (`/gaadigear`)
- Promotional banner/carousel (seasonal offers, admin-editable)
- Vehicle type tiles (Car/Bike/Commercial) — visual, not just top-nav pills
- "Shop by your vehicle" search **with live autosuggest**, not a static placeholder
- Category tiles with icons (text-only pills are fine as secondary nav, but icons help scan speed)
- Featured brands strip (logo carousel)
- New arrivals — a proper grid (4-6 per row desktop), not a single orphaned card
- Best sellers / trending (rating- or sales-driven)
- Trust strip: secure payments, genuine brands, easy 3-day returns, PAN-India delivery
- Footer: category links, "Become a seller," policies, support

### 11.2 Category / PLP (`/gaadigear/products?...`)
- Breadcrumb: `Home / GaadiGear / Riding Gear / Jackets`
- Left filter rail (desktop) / bottom-sheet (mobile): vehicle type, brand, price, rating, usage tags, availability
- Sort dropdown + an applied-filter chip row (each chip individually removable)
- Result count ("128 products")
- Product card: image, title, seller/brand, ★ rating + review count, price with MRP strikethrough + discount %, wishlist icon, quick-add on hover
- No-results state with a suggestion, not a dead end

### 11.3 PDP (`/gaadigear/products/:slug`) — needs the most work
- Breadcrumb
- Image gallery with zoom + thumbnail strip (thumbnail strip already exists per Phase 7; needs zoom)
- Title, ★ rating + review count (anchor-linked to the reviews section)
- **Seller card**: name, rating, link to the seller's storefront — not just a plain text line
- Price block: MRP strikethrough, selling price, discount %, "inclusive of all taxes"
- Variant selector as proper swatches, out-of-stock variants greyed out
- Quantity stepper
- **Delivery estimator** — a pincode input on the PDP itself, showing date + fee before add-to-cart
- **Fitment section** — "Fits: KTM Duke 390, 250, RC390" as chips, plus a "+ universal fit" indicator when applicable. This is the single biggest miss for a compatibility-driven marketplace and must not ship absent again.
- Add to cart + Buy now as two distinct buttons
- Trust badges row: secure payment, 3-day returns, GST invoice
- Bullet highlights, then full description, then a specs table
- Ratings & reviews section with a rating breakdown
- "You may also like" carousel
- Sticky mobile bottom bar (price + add to cart) on scroll

### 11.4 Cart (`/gaadigear/cart`)
- **Persistent header/nav** — must never be dropped; losing it breaks the site's whole navigation model on this page
- "← Continue shopping" link
- Items grouped by seller (already the case per Phase 5) with an editable qty stepper and stock warnings
- Coupon code field
- Order summary: subtotal, discount, shipping (or "calculated at checkout"), GST-included note, total
- Cross-sell row: "You might also need"
- Empty state: icon + message + "Browse GaadiGear" CTA

### 11.5 Checkout (`/gaadigear/checkout`)
- Header retained
- **Order summary sidebar** — must be visible on this page; a buyer should never commit to an order without seeing what's in it right there
- Saved addresses as selectable cards + "add new"
- Field labels **above** inputs, not placeholder-only (placeholder-only forms lose context mid-typing — same principle already applied to the seller dashboard forms)
- Per-seller delivery date + fee (partially there already; needs an actual date estimate, not just the fee)
- **Payment method section** — must exist as its own step; never jump straight from address to "Place order"
- "Place order" button must have an unambiguous enabled state — no washed-out/disabled-looking green when it's actually clickable

### 11.6 Order confirmation
- Success indicator, per-seller shipment cards (status independent per seller, since each seller ships independently — matches the `gear_order_shipments` model), estimated delivery date, invoice download, track-order CTA

### 11.7 Missing entirely: My Orders / seller storefront pages
- Order history list with status, tracking, reorder, and a return/refund request action (respecting the 3-day window from §5)
- Seller storefront page — brand banner, story, full catalog filtered to that seller

---

## 12. Collections & Homepage Merchandising (added 2026-07-08, reconciling an updated spec §9 against the live codebase + an already-designed homepage mockup)

> Like §11, this is a later addition — the original spec (sections 0-10) never covered merchandising/collections at all. An updated version of the source spec added this as its own §9, and a homepage UI mockup was designed against it independently. This section reconciles both against what actually exists today (naming conventions, cache pattern, real schema), the same way §1-§10 reconciled the original spec against the live DB before Phase 1 started. **Nothing in this section is built yet** — it's the plan, not a changelog entry.

### 12.1 What the mockup actually is, mapped to spec concepts

The homepage mockup is a faithful implementation of spec §9.4's described layout, top to bottom:

| Mockup section | Spec §9 concept |
|---|---|
| Header (logo, search, wishlist, cart, account) + category nav row + "Deals 🔥" tab | existing `GearSiteHeader`, plus two additions: a wishlist icon (see §12.4) and a "Deals" nav item pointing at a collection landing page |
| Hero banner ("Upgrade your ride...") + inline trust strip | `homepage_sections` row, `display_style='hero'` |
| "Shop by Category" image tiles (8 tiles: Interior, Exterior, Parts, Electronics, Riding Gear, Car Care, Travel & Lifestyle, Tyres & Wheels) | `gear_categories`, but rendered as **image tiles** — current schema has no image column (see §12.3) |
| 4 dark editorial banners (Monsoon Essentials / Weekend Ride / Premium Collection / Top Brands) | 4 `homepage_sections` rows, `display_style='banner'`, type `manual` or `category` collections |
| "Trending This Week" carousel (5 cards, arrows, Bestseller badge, fits line) | `homepage_sections` row → `gear_collections` (type `dynamic`), reads `gear_collection_products_cache` |
| "Shop by Top Brands" logo strip | new public query against the existing `gear_brands` table (already has `logo_url` — just never queried publicly, see §12.3) |
| "Best Sellers" carousel | same shape as Trending, different `conditions` — but needs a real sales signal (see §12.5, this is the one open decision that actually blocks correctness) |
| "Find the perfect fit for your vehicle" banner (Vehicle Type → Brand → Model cascading dropdowns) | reuses the existing `GearVehiclePicker` cascade already built for the hub page — not new |
| Trust strip repeat + footer | existing `SiteFooter` — no change |

Net: the mockup requires no new *page-level* invention — it's `gear_homepage_sections` (ordered, admin-editable rows) rendering a fixed set of section *types* that already have equivalents in this codebase (hero, tile grid, banner grid, product carousel, logo strip, vehicle-picker banner). What's actually new is the **collections/merchandising backend** feeding those sections, not new UI patterns.

### 12.2 Naming — same `gear_` prefix convention as Phase 1

Per the Phase 1 precedent (spec's `categories`→`gear_categories`, `products`→`gear_products`, etc.), rename on the way in:

| Spec's name | This codebase |
|---|---|
| `collections` | `gear_collections` |
| `collection_products` | `gear_collection_products` |
| `collection_products_cache` | `gear_collection_products_cache` |
| `homepage_sections` | `gear_homepage_sections` |

### 12.3 Schema gaps found (things the mockup needs that don't exist yet)

- **`gear_categories` has no image column.** The mockup's "Shop by Category" is 8 image tiles, not text pills (unlike the current hub page, §12.1 above). Needs `image_url text` added to `gear_categories` via a small migration.
- **`gear_brands` already has `logo_url`** (confirmed live in `20260707000300_gaadigear_sellers.sql`) — no schema change needed for "Shop by Top Brands," just a new `getPublicFeaturedBrands()` read (brands with ≥1 live product, ordered by product count or a manual `featured` flag) since nothing queries `gear_brands` publicly today (only ever joined from a single product's detail page).
- **No wishlist table/UI anywhere in this codebase** (confirmed via a full-repo grep — zero hits). The mockup's header wishlist icon is genuinely new scope, not a reconciliation of something already partially built. See §12.4.
- **No sales-volume signal on `gear_catalog_index`.** "Best Sellers"/"Trending This Week" as literal labels promise real signals; today the only rankable columns are `price`, `mrp`, `rating_avg`, `updated_at`. See §12.5.

### 12.4 Cache refresh — same no-cron, app-level, admin-triggered pattern as `gear_catalog_index`/`gear_model_cache`

Spec §9.2 assumes a `pg_cron` job evaluating dynamic collections every 30-60 min. Per the same finding from Phase 1 (no `pg_cron`/trigger/Edge Function exists anywhere in this project), this instead mirrors `lib/services/gear-catalog-cache/index.ts` exactly:

- `lib/services/gear-collections-cache/index.ts` (new): `rebuildCollectionCache(collectionId)` evaluates one collection's `conditions` against `gear_catalog_index` (manual collections just copy through their `gear_collection_products` list — no evaluation needed) and upserts `gear_collection_products_cache`.
- `rebuildAllCollectionCaches()` — admin-triggered bulk rebuild, same shape as `rebuildFullCatalogCache()`, exposed via a button next to the existing catalog-rebuild one.
- Per-collection `POST /api/admin/collections/:id/refresh` for a single manual refresh after editing conditions/products (immediate feedback while editing, per spec §9.6).
- **Real gap vs. spec**: there is no scheduled 30-60 min auto-refresh in this codebase's architecture (same category as the original pg_cron mismatch found before Phase 1) — a dynamic collection (Trending/Best Sellers/Biggest Discounts) only updates when an admin clicks refresh, or via the same product-mutation hooks already wired for `gear_catalog_index` invalidation, extended to also mark affected collections stale. Acceptable for v1 given this mirrors how every other cache in this system already behaves; flagging so it's a deliberate choice, not a silent gap.
- `homepage_sections` read path uses `unstable_cache` with a short `revalidate` (5-15 min, per spec §9.3's edge-cache TTL) — same idiom as `getPublicVehicleTypes`/`getPublicGearCategories`, not literal CDN/edge config (this codebase has neither Vercel Edge Config nor a CDN layer beyond Vercel's own response caching).

### 12.5 Decisions (resolved 2026-07-09)

1. **Wishlist — deferred.** Not built this phase; the header icon is dropped from the rebuilt homepage/navbar until it's scoped as its own feature.
2. **"Best Sellers" / "Trending This Week" — manual tagging, not a computed signal.** No `sales_count` column, no rating-based proxy. Both are just `gear_collections` rows with `type='manual'` — an admin (or the product's own seller, via a lightweight per-product toggle) adds specific products to the "Best Sellers" / "Trending This Week" list directly, the same hand-picked mechanism spec §9.1 already defines for things like "Monsoon Essentials"/"Staff Picks." This is simpler than either option originally posed and needs zero new tracking machinery — it's exactly what `gear_collection_products` already models.

Build order: (a) migration for `gear_collections` / `gear_collection_products` / `gear_collection_products_cache` / `gear_homepage_sections` + `gear_categories.image_url`, (b) `gear-collections-cache` service (manual collections just copy-through; `dynamic` type supported only for conditions computable from existing `gear_catalog_index` columns — price, discount %, category, brand — per spec §9.1's own phasing note), (c) admin Collections & Homepage manager (list-first, per §7), (d) buyer-side homepage read path + collection landing pages, (e) rebuild `/gaadigear` hub page section-by-section to match the mockup, minus the wishlist icon.

---

## 13. Hero, Category Images, Vehicle-Finder Search Page & Category Feed (planned 2026-07-09, not yet built)

> Follow-up round after live use of the Collections admin (§12) surfaced concrete gaps: the hero is hardcoded with no admin control, categories have an `image_url` column with no UI to set it, every image field added in §12 is a raw URL text box instead of an upload, and the "shop by vehicle" experience is a single inline search box rather than a real filtered search flow. Planned here before any code changes, per user request.

### 13.1 Admin-editable hero, clickable only if a category is chosen
- Migration: add `image_url text` and `link_category_id uuid references gear_categories(id)` to `gear_homepage_sections`.
- A hero shows no product list, so it needs no `collection_id` at all — hero sections can leave it `null`.
- Admin form: when a section's display style is `Hero`, show Headline (title), Subtext (subtitle), an image upload, and a "Link to category" dropdown of L1 categories (default: none).
- Rendering: the hub page takes the first **active** `display_style='hero'` section (lowest `sort_order`) and renders it as the actual top hero, replacing today's hardcoded block. Wrapped in a `<Link href="/gaadigear/products?category=<slug>">` only if `link_category_id` is set; otherwise a plain non-interactive block — no pointer cursor, no click.

### 13.2 Category admin image upload
- No schema change needed (`gear_categories.image_url` already exists from §12).
- Add an upload tile (thumbnail + upload/remove) to `GearCategoriesList.tsx` — reuses the existing generic `/api/admin/upload-to-storage` route (`bucket=gear-product-images`, `prefix=categories`), the same endpoint already used for seller logo/banner uploads. This closes a real gap: the column and backend support were added in §12 but no UI ever exposed it.

### 13.3 No raw URL text fields for images — upload everywhere
- Convert `GearCollectionsList`'s current "Banner image URL" text input to the same upload-tile pattern.
- The new hero image (13.1) and category image (13.2) are built as uploads from the start, not text fields.

### 13.4 New dedicated vehicle-search page: `/gaadigear/search`
**Decided**: a genuinely separate route (not a redesign of the existing PLP) — a large, well-designed cascading picker only, no product grid on this page itself: **Vehicle Type → Brand → Model** (stops at Model; no Variant tier — most compatibility data doesn't go that granular, and variant-level filtering isn't exposed as a buyer-facing facet anywhere else today). A "Show products" button — enabled as soon as Vehicle Type is picked, usable at any depth — navigates into the existing `/gaadigear/products` PLP with whichever filters got resolved (`?vehicle_type=`, plus `&brand_id=`/`&model_id=` if chosen), handing off to the PLP's already-working filter logic rather than duplicating it.
- **Data needed**: brands/models annotated with their resolved `vehicleTypeId` for client-side cascade filtering. Requires one new server-side helper (mirrors the `resolveModelContext` join built for the earlier model-filter bug fix, but batched across all models/brands at once rather than per-model) — a single join query, not N+1.
- **Homepage wiring**: the hero's **Search by Vehicle** CTA now links to `/gaadigear/search` instead of anchor-scrolling to an inline picker. The current bottom-of-homepage "Find the perfect fit for your vehicle" section (the plain `GearVehiclePicker` search box) is removed in favor of a CTA banner pointing at the same new page — so there's exactly one vehicle-search entry point, not two competing ones. **Shop by Category** keeps its current behavior (scrolls to the on-page category tiles) since that flow isn't in question here.

### 13.5 Per-L1-category homepage feed (below the merchandising sections)
- After hero/banners/carousels/brands, render one section per L1 category (Interior, Exterior, Parts, …), each up to 10 live products (`getGearProductsPLP({ category: slug, limit: 10 })` — already supports this) plus a "See all →" link to the filtered PLP.
- Loads progressively via a **"Load more categories" button** (click-triggered, mirroring `GearProductGrid`'s existing "Load more" pattern — recommended default, not yet explicitly confirmed by the user) rather than scroll-triggered auto-load, so no new interaction pattern (IntersectionObserver etc.) enters the codebase. Button disappears once every L1 category has been shown (bounded by however many exist — 9 today — not literally infinite, but automatically includes new L1 categories if added later).
- New lightweight API route needed (e.g. `GET /api/public/gaadigear/homepage/category-feed?cursor=<index>&limit=10`), cursor being a simple index into the ordered L1 category list, not a data keyset.

---

## 14. Variant Pricing Model Correction (built 2026-07-09 — supersedes §2.1's `products`/`product_variants` shape)

> §2.1's original `products` table (own `mrp`/`selling_price`/`stock_qty`) plus `product_variants.additional_price` (an additive delta on top) is **no longer accurate** — live-data inspection found every seller who ever used a variant had entered what they clearly intended as that variant's own absolute price into the delta field, producing nonsensical totals (e.g. a ₹1699 jacket with a "M/Black" variant delta of 1699 rendering as ₹3398). This wasn't a one-off mistake; it happened on both real products in the database. See `GAADIGEAR_PLAN.md`'s 2026-07-09 entries for the full incident.

**Corrected model**: there is no product-level price at all. `gear_products` carries no `mrp`/`selling_price`/`stock_qty` columns. `gear_product_variants` carries its own absolute `mrp`/`selling_price`/`stock_qty` (replacing `additional_price`), and **every product always has ≥ 1 variant** — enforced at the application layer (product creation always bootstraps a "default variant" in the same call; the last remaining variant on a product can't be deleted), not a DB constraint, consistent with this codebase's general preference for app-level enforcement over DB triggers (the refund-window trigger in §5 remains the one deliberate exception, being a hard compliance rule).

Everywhere a product's "price" is needed for display where no specific variant is in context (PLP cards, catalog cache, the Recommended Gear widget, admin/seller product lists), it's the **cheapest variant's** mrp/selling price, flagged with a `startingFrom`/`starting_from` boolean so the UI can render "Starting from ₹X" instead of implying that's the product's only price.

**Build order**: (a) migration for the two new `gear_homepage_sections` columns, (b) category/collection/hero image uploads (13.2, 13.3, part of 13.1), (c) hero rendering + admin form (13.1), (d) `/gaadigear/search` page + its vehicle-type-annotated brand/model helper (13.4), (e) homepage rewiring (hero CTA target, removing the duplicate picker section) (13.4), (f) per-category feed + its API route (13.5).
