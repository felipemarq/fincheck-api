// src/application/controllers/taxes/schemas/monthlyTaxQuerySchema.ts
import { z } from "zod";

export const monthlyTaxQuerySchema = z.object({
  entityId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type MonthlyTaxQuery = z.infer<typeof monthlyTaxQuerySchema>;
