// src/application/controllers/taxes/schemas/upsertTaxRateSchema.ts
import { z } from "zod";

export const upsertTaxRateParamsSchema = z.object({
  entityId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const upsertTaxRateBodySchema = z.object({
  ratePercent: z.coerce.number().min(0).max(100), // ex.: 6.00
});

export type UpsertTaxRateParams = z.infer<typeof upsertTaxRateParamsSchema>;
export type UpsertTaxRateBody = z.infer<typeof upsertTaxRateBodySchema>;
