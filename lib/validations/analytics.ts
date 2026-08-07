import { z } from "zod";

export const pageviewSchema = z.object({
  visitorId: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(100),
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).optional(),
  utm: z
    .object({
      utm_source: z.string().max(200).optional(),
      utm_medium: z.string().max(200).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
    })
    .optional(),
});
