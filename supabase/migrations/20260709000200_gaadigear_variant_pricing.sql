-- Variant pricing redesign. Every product previously carried its own
-- mrp/selling_price/stock_qty *and* separately allowed variants with an
-- additive "additional_price" delta on top -- in practice every seller who
-- used variants entered an absolute price into that delta field, producing
-- nonsensical totals (base price + what they thought was the variant's own
-- price). Collapsing to one model: every product has >= 1 variant (enforced
-- at the application layer in lib/services/seller-catalog, not here), and
-- each variant carries its own absolute mrp/selling_price/stock_qty. There is
-- no more product-level price at all.

alter table gear_product_variants
  add column if not exists mrp numeric(10,2),
  add column if not exists selling_price numeric(10,2);

-- Per user decision: existing variant rows are left as-is (their old
-- additional_price values do not get reinterpreted/copied into the new
-- columns) -- re-enter real mrp/selling_price for existing variants via the
-- seller dashboard once this ships.
alter table gear_product_variants drop column if exists additional_price;

alter table gear_products
  drop column if exists mrp,
  drop column if exists selling_price,
  drop column if exists stock_qty;

-- gear_catalog_index.price/mrp now represent the cheapest variant's price/mrp
-- (a product can have several variants at different prices). This flag tells
-- the PLP/collection cards whether to render "Starting from ₹X" (>1 variant)
-- or a plain price (exactly 1 variant).
alter table gear_catalog_index add column if not exists starting_from boolean not null default false;

notify pgrst, 'reload schema';
