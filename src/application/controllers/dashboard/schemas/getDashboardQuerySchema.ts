import { z } from "zod";

export const getDashboardQuerySchema = z
  .object({
    entityId: z.string().uuid(),
    range: z.enum(["this-month", "last-30d", "custom"]).default("this-month"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    sections: z
      .string()
      .optional()
      .transform((s) =>
        s
          ? Array.from(
              new Set(
                s
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean)
              )
            )
          : []
      ),
    topN: z.coerce.number().int().min(1).max(20).default(5),
    // base de cálculo para cashflow/balances
    basis: z.enum(["competence", "cash"]).optional().default("cash"),
  })
  .superRefine((data, ctx) => {
    if (data.range === "custom") {
      if (!data.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "from é obrigatório quando range=custom",
          path: ["from"],
        });
      }
      if (!data.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "to é obrigatório quando range=custom",
          path: ["to"],
        });
      }
      if (data.from && data.to && data.from > data.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "from não pode ser maior que to",
          path: ["from"],
        });
      }
    }
  });

export type GetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;
