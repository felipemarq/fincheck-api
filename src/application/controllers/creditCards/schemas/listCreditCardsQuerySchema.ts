import { z } from "zod";

const csvToUuidArray = z.preprocess((val) => {
  if (val == null) return [];
  const arr = Array.isArray(val) ? val : [String(val)];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}, z.array(z.string().uuid()));

export const listCreditCardsQuerySchema = z.object({
  entityId: z.string().uuid(),
  accountId: csvToUuidArray.optional(),
});

export type ListCreditCardsQuery = z.infer<typeof listCreditCardsQuerySchema>;
