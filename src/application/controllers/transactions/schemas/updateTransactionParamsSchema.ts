import { z } from "zod";

export const updateTransactionParamsSchema = z.object({
  transactionId: z.string().uuid(),
});
export type UpdateTransactionParams = z.infer<
  typeof updateTransactionParamsSchema
>;
