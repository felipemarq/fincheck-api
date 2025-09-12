// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createTransactionSchema } from "./createTransactionSchema";

export const updateTransactionSchema = createTransactionSchema;

export type UpdateTransactionBody = z.infer<typeof updateTransactionSchema>;
