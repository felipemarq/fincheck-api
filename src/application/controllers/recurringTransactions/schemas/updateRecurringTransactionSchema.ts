// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createRecurringTransactionSchema } from "./createRecurringTransactionSchema";

const baseRecurringTransactionSchema =
  createRecurringTransactionSchema.innerType();

export const updateRecurringTransactionSchema =
  baseRecurringTransactionSchema
    .partial()
    .extend({
      entityId: baseRecurringTransactionSchema.shape.entityId,
    })
    .refine(
      (data) =>
        !data.endDate || !data.startDate || data.endDate >= data.startDate,
      {
        message: "Data de término não pode ser anterior à data de início",
        path: ["startDate"],
      },
    );

export type UpdateRecurringTransactionBody = z.infer<
  typeof updateRecurringTransactionSchema
>;
