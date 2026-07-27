import { z } from "zod";

export const gearCategorySchema = z.object({
  parentId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  level: z.coerce.number().int().min(1).max(2),
  applicableVehicleTypes: z.array(z.string().uuid()).default([]),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal("")),
});

export const gearCollectionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional().or(z.literal("")),
  type: z.enum(["manual", "dynamic", "brand", "category", "vehicle"]),
  bannerImage: z.string().optional().or(z.literal("")),
  icon: z.string().optional().or(z.literal("")),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  maxProducts: z.coerce.number().int().min(1).max(48).default(12),
  conditions: z.record(z.string(), z.unknown()).default({}),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  productIds: z.array(z.string().uuid()).optional(),
});

// displayStyle lives only here -- it's the only place it's ever rendered
// from (the standalone collection landing page always renders a plain grid).
export const gearHomepageSectionSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional().or(z.literal("")),
  collectionId: z.string().uuid().optional().or(z.literal("")),
  displayStyle: z.enum(["carousel", "grid", "banner", "hero", "featured"]).default("carousel"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const gearHeroBannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  ctaLabel: z.string().optional().or(z.literal("")),
  ctaHref: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const sellerModerationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().uuid() }),
  z.object({ action: z.literal("reject"), id: z.string().uuid(), reason: z.string().min(3) }),
  z.object({ action: z.literal("suspend"), id: z.string().uuid() }),
]);

export const gearProductModerationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().uuid() }),
  z.object({ action: z.literal("reject"), id: z.string().uuid(), reason: z.string().min(3) }),
  z.object({ action: z.literal("pause"), id: z.string().uuid() }),
  z.object({ action: z.literal("resume"), id: z.string().uuid() }),
]);

export const refundModerationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    id: z.string().uuid(),
    refundAmount: z.coerce.number().positive(),
    refundShipping: z.boolean().default(false),
  }),
  z.object({ action: z.literal("reject"), id: z.string().uuid(), adminNotes: z.string().min(3) }),
]);
