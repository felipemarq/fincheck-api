import { z } from "zod";

export const updateCreditCardParamsSchema = z.object({
  creditCardId: z.string().uuid(),
});
export type UpdateCreditCardParams = z.infer<
  typeof updateCreditCardParamsSchema
>;
