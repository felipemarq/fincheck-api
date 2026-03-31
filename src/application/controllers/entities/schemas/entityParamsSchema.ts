import { z } from "zod";

export const entityParamsSchema = z.object({
  entityId: z.string().uuid(),
});

export type EntityParams = z.infer<typeof entityParamsSchema>;
