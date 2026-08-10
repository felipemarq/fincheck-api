import { optionalDate, optionalString, organizationParamsSchema } from "@application/controllers/v2Schemas";
import { Payable } from "@application/entities/Payable";
import { z } from "zod";

export const listPayablesQuerySchema = z.object({
  status: z.nativeEnum(Payable.Status).optional(),
  creditCardId: z.string().uuid().optional(),
  search: optionalString(160),
  dueFrom: optionalDate,
  dueTo: optionalDate,
});

export const updatePayableSchema = z.object({
  status: z.enum([Payable.Status.OPEN, Payable.Status.PAID]),
  paidAt: optionalDate,
});

export const settleCreditCardStatementSchema = z.object({
  creditCardId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(9999),
  month: z.coerce.number().int().min(1).max(12),
  paidAt: optionalDate,
});

export const payableParamsSchema = organizationParamsSchema.extend({
  payableId: z.string().uuid(),
});

export type ListPayablesQuery = z.infer<typeof listPayablesQuerySchema>;
export type UpdatePayableBody = z.infer<typeof updatePayableSchema>;
export type SettleCreditCardStatementBody = z.infer<
  typeof settleCreditCardStatementSchema
>;
export type PayableParams = z.infer<typeof payableParamsSchema>;
