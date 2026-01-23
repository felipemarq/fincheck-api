// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createRecurringTransactionSchema } from "./createRecurringTransactionSchema";

export const updateRecurringTransactionSchema =
  createRecurringTransactionSchema.partial().extend({
    entityId: createRecurringTransactionSchema.shape.entityId,
  });

export type UpdateRecurringTransactionBody = z.infer<
  typeof updateRecurringTransactionSchema
>;
