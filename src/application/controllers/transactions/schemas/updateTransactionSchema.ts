// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { createTransactionSchema } from "./createTransactionSchema";

const baseTransactionSchema = createTransactionSchema.innerType();

export const updateTransactionSchema = baseTransactionSchema
  .partial()
  .extend({
    entityId: baseTransactionSchema.shape.entityId,
  })
  .refine(
    (data) => !data.dueDate || !data.date || data.dueDate >= data.date,
    {
      message: "dueDate não pode ser anterior à data",
      path: ["dueDate"],
    },
  );

export type UpdateTransactionBody = z.infer<typeof updateTransactionSchema>;
