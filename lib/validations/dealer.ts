import { z } from "zod";

export const dealerSignupStartSchema = z.object({
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const dealerSignupChangeEmailSchema = z.object({
  pendingId: z.string().uuid(),
  email: z.string().email(),
});

export const dealerCompleteSignupSchema = z.object({
  pendingId: z.string().uuid(),
  password: z.string().min(8),
  cityId: z.string().uuid(),
  area: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  brandIds: z.array(z.string().uuid()).default([]),
});
