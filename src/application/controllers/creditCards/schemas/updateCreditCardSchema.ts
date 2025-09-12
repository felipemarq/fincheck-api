// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createCreditCardSchema } from "./createCreditCardSchema";

export const updateCreditCardSchema = createCreditCardSchema;

export type UpdateCreditCardBody = z.infer<typeof updateCreditCardSchema>;
