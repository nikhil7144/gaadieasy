import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/format";
import type { ComparisonPage, FaqItem } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function mapPage(row: DbRow): ComparisonPage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    cityId: String(row.city_id ?? ""),
    vehicle1ModelId: String(row.v1_model_id ?? ""),
    vehicle1VariantId: String(row.v1_variant_id ?? ""),
    vehicle2ModelId: String(row.v2_model_id ?? ""),
    vehicle2VariantId: String(row.v2_variant_id ?? ""),
    vehicle3ModelId: typeof row.v3_model_id === "string" ? row.v3_model_id : undefined,
    vehicle3VariantId: typeof row.v3_variant_id === "string" ? row.v3_variant_id : undefined,
    metaTitle: String(row.meta_title ?? ""),
    metaDescription: String(row.meta_description ?? ""),
    intro: String(row.intro ?? ""),
    verdict: String(row.verdict ?? ""),
    faq: Array.isArray(row.faq) ? (row.faq as FaqItem[]) : [],
    showOnHomepage: Boolean(row.show_on_homepage),
    showInFooter: Boolean(row.show_in_footer),
    displayOrder: Number(row.display_order ?? 0),
    active: Boolean(row.active),
  };
}

export async function getComparisonPagesFromDb(): Promise<ComparisonPage[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("comparison_pages")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPage);
}

export async function createComparisonPageInDb(input: {
  slug?: string;
  title: string;
  cityId: string;
  vehicle1ModelId: string;
  vehicle1VariantId: string;
  vehicle2ModelId: string;
  vehicle2VariantId: string;
  vehicle3ModelId?: string;
  vehicle3VariantId?: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  verdict: string;
  faq?: FaqItem[];
  showOnHomepage?: boolean;
  showInFooter?: boolean;
  displayOrder?: number;
  active?: boolean;
}): Promise<ComparisonPage> {
  const supabase = getAdminClient();
  const slug = input.slug?.trim() || slugify(input.title);

  const { data, error } = await supabase
    .from("comparison_pages")
    .insert({
      slug,
      title: input.title.trim(),
      city_id: input.cityId,
      v1_model_id: input.vehicle1ModelId,
      v1_variant_id: input.vehicle1VariantId,
      v2_model_id: input.vehicle2ModelId,
      v2_variant_id: input.vehicle2VariantId,
      v3_model_id: input.vehicle3ModelId || null,
      v3_variant_id: input.vehicle3VariantId || null,
      meta_title: input.metaTitle.trim(),
      meta_description: input.metaDescription.trim(),
      intro: input.intro.trim(),
      verdict: input.verdict.trim(),
      faq: input.faq ?? [],
      show_on_homepage: input.showOnHomepage ?? false,
      show_in_footer: input.showInFooter ?? false,
      display_order: input.displayOrder ?? 0,
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/compare");
  revalidatePath("/admin/comparisons");
  return mapPage(data as DbRow);
}

export async function updateComparisonPageInDb(input: {
  id: string;
  slug?: string;
  title?: string;
  cityId?: string;
  vehicle1ModelId?: string;
  vehicle1VariantId?: string;
  vehicle2ModelId?: string;
  vehicle2VariantId?: string;
  vehicle3ModelId?: string;
  vehicle3VariantId?: string;
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  verdict?: string;
  faq?: FaqItem[];
  showOnHomepage?: boolean;
  showInFooter?: boolean;
  displayOrder?: number;
  active?: boolean;
}): Promise<ComparisonPage> {
  const supabase = getAdminClient();
  const patch: DbRow = { updated_at: new Date().toISOString() };

  if (input.slug !== undefined) patch.slug = input.slug.trim() || slugify(input.title ?? "");
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.cityId !== undefined) patch.city_id = input.cityId;
  if (input.vehicle1ModelId !== undefined) patch.v1_model_id = input.vehicle1ModelId;
  if (input.vehicle1VariantId !== undefined) patch.v1_variant_id = input.vehicle1VariantId;
  if (input.vehicle2ModelId !== undefined) patch.v2_model_id = input.vehicle2ModelId;
  if (input.vehicle2VariantId !== undefined) patch.v2_variant_id = input.vehicle2VariantId;
  if (input.vehicle3ModelId !== undefined) patch.v3_model_id = input.vehicle3ModelId || null;
  if (input.vehicle3VariantId !== undefined) patch.v3_variant_id = input.vehicle3VariantId || null;
  if (input.metaTitle !== undefined) patch.meta_title = input.metaTitle.trim();
  if (input.metaDescription !== undefined) patch.meta_description = input.metaDescription.trim();
  if (input.intro !== undefined) patch.intro = input.intro.trim();
  if (input.verdict !== undefined) patch.verdict = input.verdict.trim();
  if (input.faq !== undefined) patch.faq = input.faq;
  if (input.showOnHomepage !== undefined) patch.show_on_homepage = input.showOnHomepage;
  if (input.showInFooter !== undefined) patch.show_in_footer = input.showInFooter;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase
    .from("comparison_pages")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/compare");
  revalidatePath("/admin/comparisons");
  return mapPage(data as DbRow);
}

export async function deleteComparisonPageFromDb(id: string): Promise<{ id: string }> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("comparison_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/compare");
  revalidatePath("/admin/comparisons");
  return { id };
}
