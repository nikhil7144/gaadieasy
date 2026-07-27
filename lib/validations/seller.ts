import { z } from "zod";

export const sellerSignupStartSchema = z.object({
  businessName: z.string().min(2),
  email: z.string().email(),
});

export const sellerSignupChangeEmailSchema = z.object({
  pendingId: z.string().uuid(),
  email: z.string().email(),
});

export const sellerCompleteSignupSchema = z.object({
  pendingId: z.string().uuid(),
  password: z.string().min(8),
  contactPhone: z.string().optional(),
});

export const sellerOnboardingSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("business_details"),
    businessName: z.string().min(2).optional(),
    brandName: z.string().optional(),
    businessType: z.enum(["individual", "proprietorship", "partnership", "pvt_ltd"]).optional(),
    gstin: z.string().optional(),
    pan: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    about: z.string().max(2000).optional(),
  }),
  z.object({
    step: z.literal("categories"),
    categoryIds: z.array(z.string().uuid()).default([]),
  }),
  z.object({
    step: z.literal("kyc_document"),
    docType: z.enum(["gst_certificate", "pan_card", "cancelled_cheque", "address_proof"]),
    fileUrl: z.string().url(),
  }),
  z.object({
    step: z.literal("bank_details"),
    accountHolder: z.string().optional(),
    accountNumberEnc: z.string().optional(),
    ifsc: z.string().optional(),
    upiId: z.string().optional(),
    payoutCycle: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  }),
]);

export const sellerProductCompatibilitySchema = z.object({
  compatibilityType: z.enum(["global", "vehicle_type", "segment", "brand", "model", "variant"]),
  vehicleTypeId: z.string().uuid().optional(),
  segment: z.string().optional(),
  vehicleBrandId: z.string().uuid().optional(),
  vehicleModelId: z.string().uuid().optional(),
  vehicleVariantId: z.string().uuid().optional(),
});

// Product-level fields only -- there is no product-level price anymore.
// Every product always has >= 1 variant, and price/stock live there
// exclusively (see lib/services/seller-catalog).
export const sellerProductSchema = z.object({
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  title: z.string().min(3),
  slug: z.string().min(3).optional(),
  description: z.string().optional(),
  gstRate: z.coerce.number().min(0).max(28).default(18),
  hsnCode: z.string().optional(),
  sku: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  usageTags: z.array(z.string()).default([]),
  compatibility: z.array(sellerProductCompatibilitySchema).min(1),
});

// Creation only: bootstraps the mandatory first ("default") variant alongside
// the product itself, in one call -- a product can't exist with zero
// variants, so its price/stock/size/color must be supplied at creation time.
export const sellerProductCreateSchema = sellerProductSchema.extend({
  defaultVariant: z.object({
    size: z.string().optional(),
    color: z.string().optional(),
    mrp: z.coerce.number().positive(),
    sellingPrice: z.coerce.number().positive(),
    stockQty: z.coerce.number().int().min(0).default(0),
  }),
});

export const sellerProductActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), id: z.string().uuid() }).merge(sellerProductSchema.partial()),
  z.object({ action: z.literal("publish"), id: z.string().uuid() }),
  z.object({ action: z.literal("pause"), id: z.string().uuid() }),
  z.object({ action: z.literal("resume"), id: z.string().uuid() }),
]);

export const sellerShipmentActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ship"), shipmentId: z.string().uuid(), courierName: z.string().min(2), trackingNumber: z.string().min(2) }),
  z.object({ action: z.literal("deliver"), shipmentId: z.string().uuid() }),
]);

// mrp/sellingPrice have no .default() -- required on create (full schema),
// optional on update (via .partial() below), matching every other field here.
export const sellerProductVariantInputSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  mrp: z.coerce.number().positive(),
  sellingPrice: z.coerce.number().positive(),
  stockQty: z.coerce.number().int().min(0).default(0),
  skuSuffix: z.string().optional(),
  images: z.array(z.string()).max(2).optional(),
});

export const sellerProductVariantActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), productId: z.string().uuid() }).merge(sellerProductVariantInputSchema),
  z.object({ action: z.literal("update"), variantId: z.string().uuid() }).merge(sellerProductVariantInputSchema.partial()),
  z.object({ action: z.literal("delete"), variantId: z.string().uuid() }),
]);

export const sellerShippingSettingsSchema = z.object({
  shipsPanIndia: z.boolean().default(true),
  excludedStates: z.array(z.string()).default([]),
  excludedPincodes: z.array(z.string()).default([]),
  feeType: z.enum(["flat", "free", "threshold"]).default("flat"),
  flatFee: z.coerce.number().min(0).default(0),
  freeShippingAbove: z.coerce.number().min(0).optional(),
  standardDeliveryDays: z.coerce.number().int().min(1).default(5),
  codAvailable: z.boolean().default(false),
});
