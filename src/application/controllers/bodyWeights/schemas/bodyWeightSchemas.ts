import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data no formato AAAA-MM-DD.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Informe uma data valida.");

export const bodyWeightParamsSchema = z.object({
  measuredOn: isoDateSchema,
});

export const listBodyWeightsQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "A data inicial deve ser anterior ou igual a data final.",
    path: ["from"],
  });

export const upsertBodyWeightSchema = z.object({
  weightKg: z.coerce
    .number()
    .finite()
    .min(20, "O peso minimo permitido e 20 kg.")
    .max(500, "O peso maximo permitido e 500 kg."),
});

export type BodyWeightParams = z.infer<typeof bodyWeightParamsSchema>;
export type ListBodyWeightsQuery = z.infer<
  typeof listBodyWeightsQuerySchema
>;
export type UpsertBodyWeightBody = z.infer<typeof upsertBodyWeightSchema>;
