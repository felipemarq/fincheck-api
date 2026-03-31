import { z } from "zod";

export const contactParamsSchema = z.object({
  entityId: z.string().uuid(),
  contactId: z.string().uuid(),
});

export type ContactParams = z.infer<typeof contactParamsSchema>;
