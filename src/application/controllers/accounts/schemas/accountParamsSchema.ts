import { z } from "zod";

export const accountParamsSchema = z.object({
  entityId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export type AccountParams = z.infer<typeof accountParamsSchema>;
