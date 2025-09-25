import { z } from "zod";

export const listCategoriesQuerySchema = z.object({
  entityId: z.string().uuid(),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
