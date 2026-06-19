import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/format";
import type { VehicleStory, VehicleStoryMedia, VehicleStoryType, VehicleStoryUpdate } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function optionalText(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

function cleanPathPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function mapStory(row: DbRow): VehicleStory {
  return {
    id: String(row.id),
    slug: String(row.slug),
    brandSlug: String(row.brand_slug),
    brandName: String(row.brand_name),
    modelId: typeof row.model_id === "string" ? row.model_id : undefined,
    storyType: (row.story_type === "brand_update" ? "brand_update" : "vehicle_story") as VehicleStoryType,
    title: String(row.title),
    tagline: typeof row.tagline === "string" ? row.tagline : undefined,
    heroImageUrl: typeof row.hero_image_url === "string" ? row.hero_image_url : undefined,
    intro: String(row.intro ?? ""),
    body: String(row.body ?? ""),
    launchStatus: String(row.launch_status ?? "upcoming") as VehicleStory["launchStatus"],
    expectedLaunchDate: typeof row.expected_launch_date === "string" ? row.expected_launch_date : undefined,
    actualLaunchDate: typeof row.actual_launch_date === "string" ? row.actual_launch_date : undefined,
    seoTitle: typeof row.seo_title === "string" ? row.seo_title : undefined,
    seoDescription: typeof row.seo_description === "string" ? row.seo_description : undefined,
    featured: Boolean(row.featured),
    publishedAt: typeof row.published_at === "string" ? row.published_at : undefined,
    active: Boolean(row.active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapStoryUpdate(row: DbRow): VehicleStoryUpdate {
  return {
    id: String(row.id),
    storyId: String(row.story_id),
    title: String(row.title),
    body: String(row.body ?? ""),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    postedAt: String(row.posted_at),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

function mapStoryMedia(row: DbRow): VehicleStoryMedia {
  return {
    id: String(row.id),
    storyId: String(row.story_id),
    url: String(row.url),
    alt: String(row.alt ?? ""),
    displayOrder: Number(row.display_order ?? 0),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

export async function getVehicleStories(options?: { activeOnly?: boolean; featuredFirst?: boolean; storyType?: VehicleStoryType }): Promise<VehicleStory[]> {
  const supabase = getAdminClient();
  let query = supabase.from("vehicle_stories").select("*").order("created_at", { ascending: false });
  if (options?.activeOnly) query = query.eq("active", true);
  if (options?.storyType) query = query.eq("story_type", options.storyType);
  if (options?.featuredFirst) query = query.order("featured", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapStory);
}

export async function getVehicleStoryBySlug(brandSlug: string, modelSlug: string): Promise<VehicleStory | null> {
  const supabase = getAdminClient();
  const slug = `${brandSlug}-${modelSlug}`;
  const { data, error } = await supabase
    .from("vehicle_stories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStory(data as DbRow) : null;
}

export async function getVehicleStoryUpdates(storyId: string): Promise<VehicleStoryUpdate[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("vehicle_story_updates")
    .select("*")
    .eq("story_id", storyId)
    .eq("active", true)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapStoryUpdate);
}

export async function getVehicleStoryMedia(storyId: string): Promise<VehicleStoryMedia[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("vehicle_story_media")
    .select("*")
    .eq("story_id", storyId)
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapStoryMedia);
}

export async function createVehicleStory(input: {
  brandSlug: string;
  brandName: string;
  modelId?: string;
  storyType?: VehicleStoryType;
  title: string;
  tagline?: string;
  heroImageUrl?: string;
  intro: string;
  body?: string;
  launchStatus: VehicleStory["launchStatus"];
  expectedLaunchDate?: string;
  actualLaunchDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  publishedAt?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const brandSlug = input.brandSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const titleSlug = slugify(input.title);
  const slug = `${brandSlug}-${titleSlug}`;

  const { data, error } = await supabase
    .from("vehicle_stories")
    .insert({
      slug,
      brand_slug: brandSlug,
      brand_name: input.brandName.trim(),
      model_id: optionalText(input.modelId),
      story_type: input.storyType ?? "vehicle_story",
      title: input.title.trim(),
      tagline: optionalText(input.tagline),
      hero_image_url: optionalText(input.heroImageUrl),
      intro: input.intro.trim(),
      body: input.body?.trim() ?? "",
      launch_status: input.launchStatus,
      expected_launch_date: optionalText(input.expectedLaunchDate),
      actual_launch_date: optionalText(input.actualLaunchDate),
      seo_title: optionalText(input.seoTitle),
      seo_description: optionalText(input.seoDescription),
      featured: input.featured ?? false,
      published_at: optionalText(input.publishedAt) ?? (input.active !== false ? new Date().toISOString() : null),
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/vehicle-updates");
  revalidatePath("/admin/vehicle-updates");
  return mapStory(data as DbRow);
}

export async function updateVehicleStory(input: {
  id: string;
  brandSlug?: string;
  brandName?: string;
  modelId?: string;
  storyType?: VehicleStoryType;
  title?: string;
  tagline?: string;
  heroImageUrl?: string;
  intro?: string;
  body?: string;
  launchStatus?: VehicleStory["launchStatus"];
  expectedLaunchDate?: string;
  actualLaunchDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  publishedAt?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = { updated_at: new Date().toISOString() };

  if (input.brandSlug !== undefined) patch.brand_slug = input.brandSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (input.brandName !== undefined) patch.brand_name = input.brandName.trim();
  if (input.modelId !== undefined) patch.model_id = optionalText(input.modelId);
  if (input.storyType !== undefined) patch.story_type = input.storyType;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.tagline !== undefined) patch.tagline = optionalText(input.tagline);
  if (input.heroImageUrl !== undefined) patch.hero_image_url = optionalText(input.heroImageUrl);
  if (input.intro !== undefined) patch.intro = input.intro.trim();
  if (input.body !== undefined) patch.body = input.body.trim();
  if (input.launchStatus !== undefined) patch.launch_status = input.launchStatus;
  if (input.expectedLaunchDate !== undefined) patch.expected_launch_date = optionalText(input.expectedLaunchDate);
  if (input.actualLaunchDate !== undefined) patch.actual_launch_date = optionalText(input.actualLaunchDate);
  if (input.seoTitle !== undefined) patch.seo_title = optionalText(input.seoTitle);
  if (input.seoDescription !== undefined) patch.seo_description = optionalText(input.seoDescription);
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.publishedAt !== undefined) patch.published_at = optionalText(input.publishedAt);
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("vehicle_stories").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;

  revalidatePath("/vehicle-updates");
  revalidatePath("/admin/vehicle-updates");
  return mapStory(data as DbRow);
}

export async function deleteVehicleStory(id: string) {
  const supabase = getAdminClient();

  const { data: mediaRows } = await supabase.from("vehicle_story_media").select("url").eq("story_id", id);
  const storagePaths = (mediaRows ?? [])
    .map((row) => {
      const url = typeof row.url === "string" ? row.url : "";
      const marker = "/vehicle-story-media/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      try { return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]); } catch { return null; }
    })
    .filter((p): p is string => Boolean(p));

  if (storagePaths.length) {
    await supabase.storage.from("vehicle-story-media").remove(storagePaths);
  }

  const { error } = await supabase.from("vehicle_stories").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/vehicle-updates");
  revalidatePath("/admin/vehicle-updates");
  return { id };
}

export async function createVehicleStoryUpdate(input: {
  storyId: string;
  title: string;
  body?: string;
  imageUrl?: string;
  postedAt?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("vehicle_story_updates")
    .insert({
      story_id: input.storyId,
      title: input.title.trim(),
      body: input.body?.trim() ?? "",
      image_url: optionalText(input.imageUrl),
      posted_at: input.postedAt ?? new Date().toISOString(),
      active: input.active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/vehicle-updates");
  return mapStoryUpdate(data as DbRow);
}

export async function updateVehicleStoryUpdate(input: {
  id: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  postedAt?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.body !== undefined) patch.body = input.body.trim();
  if (input.imageUrl !== undefined) patch.image_url = optionalText(input.imageUrl);
  if (input.postedAt !== undefined) patch.posted_at = input.postedAt;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("vehicle_story_updates").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/vehicle-updates");
  return mapStoryUpdate(data as DbRow);
}

export async function deleteVehicleStoryUpdate(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("vehicle_story_updates").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/vehicle-updates");
  return { id };
}

export async function uploadVehicleStoryMediaFile(input: {
  storyId: string;
  storySlug: string;
  file: File;
  alt?: string;
  displayOrder?: number;
}) {
  const supabase = getAdminClient();
  const path = `${cleanPathPart(input.storySlug)}/${Date.now()}-${cleanPathPart(input.file.name)}`;

  const { error: uploadError } = await supabase.storage.from("vehicle-story-media").upload(path, input.file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: input.file.type,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from("vehicle-story-media").getPublicUrl(path);

  const { data, error } = await supabase
    .from("vehicle_story_media")
    .insert({
      story_id: input.storyId,
      url: urlData.publicUrl,
      alt: input.alt?.trim() ?? "",
      display_order: input.displayOrder ?? 0,
      active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/vehicle-updates");
  return mapStoryMedia(data as DbRow);
}

export async function deleteVehicleStoryMedia(id: string) {
  const supabase = getAdminClient();

  const { data: row } = await supabase.from("vehicle_story_media").select("url").eq("id", id).maybeSingle();
  if (row?.url) {
    const url = String(row.url);
    const marker = "/vehicle-story-media/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = url.slice(idx + marker.length).split("?")[0];
      if (storagePath) {
        try {
          await supabase.storage.from("vehicle-story-media").remove([decodeURIComponent(storagePath)]);
        } catch { /* best-effort */ }
      }
    }
  }

  const { error } = await supabase.from("vehicle_story_media").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/vehicle-updates");
  return { id };
}
