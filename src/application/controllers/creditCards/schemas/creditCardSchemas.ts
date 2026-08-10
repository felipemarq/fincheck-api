import { CreditCard } from "@application/entities/CreditCard";
import {
  nullableOptionalString,
  optionalBoolean,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida.");
const daySchema = z.coerce.number().int().min(1).max(31);
const creditLimitSchema = z.coerce.number().nonnegative().max(9_999_999_999);
const optionalCreditLimitSchema = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  creditLimitSchema.optional()
);

export const createCreditCardSchema = z.object({
  name: z.string().trim().min(1).max(120),
  holderName: z.string().trim().min(1).max(160),
  bank: z.string().trim().min(1).max(120),
  brand: z.nativeEnum(CreditCard.Brand),
  lastFour: z.string().regex(/^\d{4}$/, "Informe os quatro ultimos digitos."),
  color: colorSchema.optional().default("#868e96"),
  closingDay: daySchema,
  dueDay: daySchema,
  creditLimit: optionalCreditLimitSchema,
  active: z.boolean().optional().default(true),
});

export const updateCreditCardSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    holderName: z.string().trim().min(1).max(160).optional(),
    bank: z.string().trim().min(1).max(120).optional(),
    brand: z.nativeEnum(CreditCard.Brand).optional(),
    lastFour: z.string().regex(/^\d{4}$/).optional(),
    color: colorSchema.optional(),
    closingDay: daySchema.optional(),
    dueDay: daySchema.optional(),
    creditLimit: creditLimitSchema.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const listCreditCardsQuerySchema = z.object({
  active: optionalBoolean,
});

export const creditCardParamsSchema = organizationParamsSchema.extend({
  creditCardId: z.string().uuid(),
});

export type CreateCreditCardBody = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardBody = z.infer<typeof updateCreditCardSchema>;
export type ListCreditCardsQuery = z.infer<typeof listCreditCardsQuerySchema>;
export type CreditCardParams = z.infer<typeof creditCardParamsSchema>;
