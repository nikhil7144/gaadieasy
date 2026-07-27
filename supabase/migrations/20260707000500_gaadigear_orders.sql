create table if not exists gear_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users(id),
  status text not null default 'placed' check (status in
    ('placed', 'confirmed', 'partially_shipped', 'shipped', 'delivered', 'cancelled')),
  items_subtotal numeric(12,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  payment_gateway_ref text,
  payment_status text not null default 'pending' check (payment_status in
    ('pending', 'paid', 'failed', 'refunded')),
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One row per seller within an order, since each seller ships independently.
create table if not exists gear_order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references gear_orders(id) on delete cascade,
  seller_id uuid not null references sellers(id),
  items_subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  seller_payout_amount numeric(12,2) not null default 0,
  shipment_status text not null default 'placed' check (shipment_status in
    ('placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  courier_name text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_gear_order_shipments_seller on gear_order_shipments(seller_id);
create index if not exists idx_gear_order_shipments_order on gear_order_shipments(order_id);

create table if not exists gear_order_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references gear_order_shipments(id) on delete cascade,
  product_id uuid references gear_products(id),
  variant_id uuid references gear_product_variants(id),
  qty integer not null,
  unit_price numeric(10,2) not null,
  gst_rate numeric(4,2) not null,
  gst_amount numeric(10,2) not null
);

create table if not exists seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id),
  period_start date not null,
  period_end date not null,
  total_shipments integer not null default 0,
  gross_items_amount numeric(12,2) not null default 0,
  gross_shipping_amount numeric(10,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  net_payout numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  paid_at timestamptz
);

notify pgrst, 'reload schema';
