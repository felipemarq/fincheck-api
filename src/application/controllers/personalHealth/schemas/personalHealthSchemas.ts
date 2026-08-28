import { isoDateSchema } from "@application/controllers/schemas/isoDateSchema";
import { z } from "zod";

const nullableNumber = (schema: z.ZodNumber) =>
  z.union([schema, z.null()]).optional().default(null);

const nullableDate = isoDateSchema.nullable().optional().default(null);

function ageOn(birthDate: string, onDate: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [year, month, day] = onDate.split("-").map(Number);
  const beforeBirthday =
    month < birthMonth || (month === birthMonth && day < birthDay);
  return year - birthYear - (beforeBirthday ? 1 : 0);
}

export const healthProfileQuerySchema = z.object({
  onDate: isoDateSchema.optional(),
});

export const upsertPersonalHealthProfileSchema = z
  .object({
    targetWeightKg: nullableNumber(
      z.coerce.number().finite().min(20).max(500)
    ),
    targetDate: nullableDate,
    heightCm: nullableNumber(
      z.coerce.number().int().min(120).max(250)
    ),
    birthDate: nullableDate,
    calculationSex: z
      .enum(["MALE", "FEMALE"])
      .nullable()
      .optional()
      .default(null),
    activityLevel: z
      .enum(["SEDENTARY_LIGHT", "ACTIVE_MODERATE", "VIGOROUS"])
      .nullable()
      .optional()
      .default(null),
    dailyExpenditureOverrideKcal: nullableNumber(
      z.coerce.number().int().min(500).max(10_000)
    ),
  })
  .superRefine((value, context) => {
    if (!value.birthDate) return;

    const today = new Date().toISOString().slice(0, 10);
    const age = ageOn(value.birthDate, today);
    if (age < 18 || age > 120) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "A estimativa e destinada a adultos entre 18 e 120 anos.",
      });
    }
  });

export const dailyCalorieParamsSchema = z.object({
  loggedOn: isoDateSchema,
});

export const listDailyCaloriesQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "A data inicial deve ser anterior ou igual a data final.",
    path: ["from"],
  });

export const upsertDailyCalorieSchema = z.object({
  caloriesConsumed: z.coerce.number().int().min(0).max(20_000),
});

export type HealthProfileQuery = z.infer<typeof healthProfileQuerySchema>;
export type UpsertPersonalHealthProfileBody = z.infer<
  typeof upsertPersonalHealthProfileSchema
>;
export type DailyCalorieParams = z.infer<typeof dailyCalorieParamsSchema>;
export type ListDailyCaloriesQuery = z.infer<
  typeof listDailyCaloriesQuerySchema
>;
export type UpsertDailyCalorieBody = z.infer<
  typeof upsertDailyCalorieSchema
>;
