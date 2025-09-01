import { z } from "zod";

export const updateRecurringTransactionParamsSchema = z.object({
  recurringTransactionId: z.string().uuid(),
});
export type UpdateRecurringTransactionParams = z.infer<
  typeof updateRecurringTransactionParamsSchema
>;
