// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createCreditCardSchema } from "./createCreditCardSchema";

export const updateCreditCardSchema = createCreditCardSchema
  .partial()
  .extend({
    entityId: createCreditCardSchema.shape.entityId,
  });

export type UpdateCreditCardBody = z.infer<typeof updateCreditCardSchema>;
