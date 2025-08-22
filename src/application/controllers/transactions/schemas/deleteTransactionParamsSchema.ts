import { z } from "zod";

export const deleteTransactionParamsSchema = z.object({
  transactionId: z.string().uuid(),
  entityId: z.string().uuid(),
});
export type DeleteTransactionParams = z.infer<
  typeof deleteTransactionParamsSchema
>;
