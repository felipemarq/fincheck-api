import { z } from "zod";

export const deleteRecurringTransactionParamsSchema = z.object({
  recurringTransactionId: z.string().uuid(),
  entityId: z.string().uuid(),
});
export type DeleteRecurringTransactionParams = z.infer<
  typeof deleteRecurringTransactionParamsSchema
>;
