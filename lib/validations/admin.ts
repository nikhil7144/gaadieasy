import { z } from "zod";

const faqItemSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});

export const brandSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  categoryIds: z.array(z.string().uuid()).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const modelSchema = z.object({
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  bodyType: z.string().min(2),
  launchLabel: z.string().optional().default(""),
  loaderSize: z.enum(["Small", "Medium", "Large"]).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  overview: z.string().optional().default(""),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  faq: z.array(faqItemSchema).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  isUpcoming: z.boolean().default(false),
});

export const variantSchema = z.object({
  modelId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  exShowroomPrice: z.coerce.number().positive(),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Hybrid", "Electric"]),
  transmission: z.enum(["Manual", "Automatic", "AMT", "CVT", "DCT"]),
  engineCapacity: z.string().min(1),
  mileage: z.string().min(1),
  seatingCapacity: z.coerce.number().int().positive(),
  specifications: z.record(z.string(), z.unknown()).default({}),
  specificationGroups: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        fields: z.array(z.object({ label: z.string().min(1), value: z.string().optional() })),
      }),
    )
    .default([]),
  isDefault: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const modelImportVariantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  exShowroomPrice: z.coerce.number().positive(),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Hybrid", "Electric"]),
  transmission: z.enum(["Manual", "Automatic", "AMT", "CVT", "DCT"]),
  engineCapacity: z.string().optional(),
  mileage: z.string().optional(),
  seatingCapacity: z.coerce.number().int().positive().optional(),
  colors: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.unknown()).default({}),
  specificationGroups: variantSchema.shape.specificationGroups.optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
  active: z.boolean().default(true),
});

export const modelImportSchema = z.object({
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  model: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).optional(),
    bodyType: z.string().min(2),
    launchLabel: z.string().optional().default(""),
    loaderSize: z.enum(["Small", "Medium", "Large"]).optional().or(z.literal("")),
    imageUrl: z.string().url().optional().or(z.literal("")),
    overview: z.string().optional().default(""),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    faq: z.array(faqItemSchema).default([]),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
  variants: z.array(modelImportVariantSchema).min(1),
});

export const homepageBannerSchema = z.object({
  placement: z.enum(["homepage_hero", "mini_home_banner"]).default("mini_home_banner"),
  categoryKey: z.enum(["cars", "bikes", "scooters", "ev", "commercial", "ev-commercial", "passenger-ev"]),
  eyebrow: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  supportingCopy: z.string().optional().default(""),
  title: z.string().min(3),
  subtitle: z.string().optional().default(""),
  ctaLabel: z.string().optional().default(""),
  stat1Label: z.string().optional().default(""),
  stat1Value: z.string().optional().default(""),
  stat2Label: z.string().optional().default(""),
  stat2Value: z.string().optional().default(""),
  stat3Label: z.string().optional().default(""),
  stat3Value: z.string().optional().default(""),
  imageUrl: z.string().url(),
  targetUrl: z.string().min(2),
  active: z.boolean().default(true),
});

export const seoPageSchema = z.object({
  slug: z.string().min(3),
  pageKind: z.string().min(2),
  title: z.string().min(3),
  h1: z.string().min(3),
  metaTitle: z.string().min(3),
  metaDescription: z.string().min(10),
  intro: z.string().min(10),
  body: z.string().optional().default(""),
  filters: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
});

export const cityPageSchema = z.object({
  cityId: z.string().uuid(),
  slug: z.string().min(2),
  title: z.string().min(3),
  h1: z.string().min(3),
  metaTitle: z.string().min(3),
  metaDescription: z.string().min(10),
  intro: z.string().min(10),
  body: z.string().optional().default(""),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  featuredCategoryId: z.string().uuid().optional().or(z.literal("")),
  featuredBrandIds: z.array(z.string().uuid()).default([]),
  faq: z.array(faqItemSchema).default([]),
  showInFooter: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const comparisonPageSchema = z.object({
  slug: z.string().min(3).optional(),
  title: z.string().min(3),
  cityId: z.string().min(2),
  vehicle1ModelId: z.string().min(2),
  vehicle1VariantId: z.string().min(2),
  vehicle2ModelId: z.string().min(2),
  vehicle2VariantId: z.string().min(2),
  vehicle3ModelId: z.string().optional(),
  vehicle3VariantId: z.string().optional(),
  metaTitle: z.string().min(3),
  metaDescription: z.string().min(10),
  intro: z.string().min(10),
  verdict: z.string().min(10),
  faq: z.array(faqItemSchema).default([]),
  showOnHomepage: z.boolean().default(false),
  showInFooter: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const dealerBusinessSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  active: z.boolean().default(true),
  verified: z.boolean().default(false),
});

export const dealerSchema = z.object({
  dealerBusinessId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2),
  slug: z.string().min(2).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  cityId: z.string().uuid(),
  area: z.string().optional().default(""),
  contactPerson: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional().default(""),
  active: z.boolean().default(true),
  verified: z.boolean().default(false),
  priority: z.coerce.number().int().default(0),
});

export const dealerBrandMappingSchema = z.object({
  dealerId: z.string().uuid(),
  brandId: z.string().uuid(),
  cityId: z.string().uuid(),
  active: z.boolean().default(true),
});

export const dealerBusinessLoginSchema = z.object({
  dealerBusinessId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
});

export const dealerShowroomLoginSchema = z.object({
  dealerId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
});

export const taxRuleSchema = z.object({
  stateId: z.string().uuid(),
  categoryId: z.string().uuid(),
  fuelType: z.enum(["Petrol", "Diesel", "CNG", "Hybrid", "Electric"]).optional().or(z.literal("")),
  minPrice: z.coerce.number().min(0),
  maxPrice: z.coerce.number().min(0).optional(),
  roadTaxPercent: z.coerce.number().min(0),
  fixedTaxAmount: z.coerce.number().min(0).default(0),
  evExemptionPercent: z.coerce.number().min(0).max(100).default(0),
  luxuryCessPercent: z.coerce.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});

export const vehicleStorySchema = z.object({
  slug: z.string().min(2).optional(),
  brandSlug: z.string().min(2),
  brandName: z.string().min(2),
  modelId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(3),
  tagline: z.string().optional().default(""),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  intro: z.string().min(10),
  body: z.string().default(""),
  launchStatus: z.enum(["upcoming", "launched", "updated", "discontinued"]).default("upcoming"),
  expectedLaunchDate: z.string().optional().or(z.literal("")),
  actualLaunchDate: z.string().optional().or(z.literal("")),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  featured: z.boolean().default(false),
  publishedAt: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const vehicleStoryUpdateSchema = z.object({
  storyId: z.string().uuid(),
  title: z.string().min(3),
  body: z.string().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")),
  postedAt: z.string().optional(),
  active: z.boolean().default(true),
});

export const rtoChargeSchema = z.object({
  stateId: z.string().uuid(),
  cityId: z.string().uuid(),
  rtoId: z.string().uuid().optional().or(z.literal("")),
  registrationFee: z.coerce.number().min(0),
  smartCardFee: z.coerce.number().min(0).default(0),
  numberPlateFee: z.coerce.number().min(0).default(0),
  hypothecationFee: z.coerce.number().min(0).default(0),
  fastagFee: z.coerce.number().min(0).default(0),
  handlingCharges: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
});
