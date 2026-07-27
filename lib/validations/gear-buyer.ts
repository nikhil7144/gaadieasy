import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  qty: z.coerce.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().uuid(),
  qty: z.coerce.number().int().min(0),
});

export const removeCartItemSchema = z.object({
  itemId: z.string().uuid(),
});

export const shippingAddressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
});

export const checkServiceabilitySchema = z.object({
  pincode: z.string().min(4),
  state: z.string().min(2),
});

export const refundRequestItemSchema = z.object({
  orderItemId: z.string().uuid(),
  qty: z.coerce.number().int().positive(),
  refundAmount: z.coerce.number().positive(),
});

export const createRefundRequestSchema = z.object({
  reasonCategory: z.enum(["defective", "wrong_item", "damaged", "not_as_described", "changed_mind"]),
  reasonNote: z.string().optional(),
  items: z.array(refundRequestItemSchema).default([]),
});
