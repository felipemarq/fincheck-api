import { z } from "zod";

export const listAccountsParamsSchema = z.object({
  entityId: z.string().uuid(),
});
export type ListAccountsParams = z.infer<typeof listAccountsParamsSchema>;
