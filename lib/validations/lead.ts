import { z } from "zod";

export const publicLeadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  cityId: z.string().min(1),
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  variantId: z.string().min(1),
  selectedOnRoadPrice: z.coerce.number().positive(),
  preferredContactTime: z.string().optional(),
  message: z.string().optional(),
  source: z.enum(["pricing_page", "seo_page", "homepage", "admin"]).default("pricing_page"),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
