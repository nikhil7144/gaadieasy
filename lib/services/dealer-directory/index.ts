import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DbRow = Record<string, unknown>;

export type DirectoryDealerRow = {
  dealerId: string;
  businessName: string;
  name: string;
  area?: string;
  cityName?: string;
  phone?: string;
  contactPerson?: string;
  brandName?: string;
  priority: number;
};

// Public read for the /dealers directory -- only shows a dealer if its
// showroom (`dealers`) is active AND its parent business has actually been
// approved (`verification_status = 'verified'`). A self-signed-up dealer is
// invisible here until an admin approves it (lib/services/admin-catalog's
// approveDealerBusiness).
export async function getVerifiedDealersByBrand(brandSlug?: string): Promise<DirectoryDealerRow[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  let brandId: string | undefined;
  if (brandSlug) {
    const { data: brandRow } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    if (!brandRow) return [];
    brandId = (brandRow as DbRow).id as string;
  }

  let query = supabase
    .from("dealer_brand_mappings")
    .select(
      "brand_id, brands(name), dealers!inner(id, name, area, phone, contact_person, priority, active, dealer_businesses!inner(name, verification_status), cities(name))",
    )
    .eq("active", true)
    .eq("dealers.active", true)
    .eq("dealers.dealer_businesses.verification_status", "verified");

  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = (data as DbRow[]).map((row) => {
    const dealer = row.dealers as DbRow;
    const business = dealer.dealer_businesses as DbRow;
    const city = dealer.cities as DbRow | null;
    const brand = row.brands as DbRow | null;
    return {
      dealerId: String(dealer.id),
      businessName: String(business.name),
      name: String(dealer.name),
      area: typeof dealer.area === "string" && dealer.area ? dealer.area : undefined,
      cityName: city ? String(city.name) : undefined,
      phone: typeof dealer.phone === "string" && dealer.phone ? dealer.phone : undefined,
      contactPerson: typeof dealer.contact_person === "string" && dealer.contact_person ? dealer.contact_person : undefined,
      brandName: brand ? String(brand.name) : undefined,
      priority: Number(dealer.priority ?? 0),
    };
  });

  // De-dupe a dealer appearing once per matching brand mapping when no
  // brand filter is active (one showroom can sell several brands).
  const seen = new Map<string, DirectoryDealerRow>();
  for (const row of rows) {
    if (!seen.has(row.dealerId)) seen.set(row.dealerId, row);
  }

  return Array.from(seen.values()).sort((a, b) => b.priority - a.priority);
}
