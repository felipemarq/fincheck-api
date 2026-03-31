import { z } from "zod";

export const contactEntityParamsSchema = z.object({
  entityId: z.string().uuid(),
});

export type ContactEntityParams = z.infer<typeof contactEntityParamsSchema>;
