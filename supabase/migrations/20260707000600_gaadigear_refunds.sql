-- payout_hold_until is a plain column, not generated: `timestamptz + interval`
-- is not IMMUTABLE in Postgres (interval day/month arithmetic depends on
-- timezone/DST), so it can't be used in a GENERATED ALWAYS AS STORED expression.
-- The application code that marks a shipment "delivered" (Phase 6) is
-- responsible for setting payout_hold_until = delivered_at + interval '3 days'
-- at the same time it sets delivered_at.
alter table if exists gear_order_shipments
add column if not exists payout_hold_until timestamptz,
add column if not exists payout_status text not null default 'not_delivered' check (payout_status in
  ('not_delivered', 'holding', 'on_hold_refund', 'eligible', 'paid', 'excluded')),
add column if not exists payout_id uuid references seller_payouts(id);

create table if not exists gear_refund_requests (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references gear_order_shipments(id),
  buyer_id uuid references auth.users(id),
  reason_category text not null,
  reason_note text,
  status text not null default 'requested' check (status in
    ('requested', 'approved', 'rejected', 'refunded')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  admin_notes text,
  refund_amount numeric(10,2),
  refund_shipping boolean not null default false,
  gateway_refund_ref text
);

-- Supports partial refunds (specific items/qty within a multi-item shipment).
create table if not exists gear_refund_request_items (
  id uuid primary key default gen_random_uuid(),
  refund_request_id uuid not null references gear_refund_requests(id) on delete cascade,
  order_item_id uuid references gear_order_items(id),
  qty integer not null,
  refund_amount numeric(10,2) not null
);

-- Hard data-integrity constraint (not a cache-refresh mechanism, so a DB trigger
-- is the right tool here): a refund can't be raised before delivery, or more than
-- 3 days after it.
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

drop trigger if exists trg_enforce_refund_window on gear_refund_requests;
create trigger trg_enforce_refund_window
before insert on gear_refund_requests
for each row execute function enforce_refund_window();

-- Weekly payout job reads this view: delivered, past the 3-day hold, no
-- unresolved refund request, not yet paid out.
create or replace view payout_eligible_shipments as
select s.*
from gear_order_shipments s
where s.shipment_status = 'delivered'
  and s.payout_id is null
  and now() >= s.payout_hold_until
  and not exists (
    select 1 from gear_refund_requests r
    where r.shipment_id = s.id
      and r.status in ('requested', 'approved')
  );

notify pgrst, 'reload schema';
