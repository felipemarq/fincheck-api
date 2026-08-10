import {
  nullableOptionalString,
  optionalBoolean,
  optionalString,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().nonnegative().max(9_999_999_999).optional()
);

const nullableOptionalMoney = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().nonnegative().max(9_999_999_999).nullable().optional()
);

const brandSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : "Outros",
  z.string().max(120)
);

const codeSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .transform((value) => value.toUpperCase());

const optionalCode = z.preprocess(
  (value) =>
    typeof value === "string" && !value.trim() ? undefined : value,
  codeSchema.optional()
);

const nullableOptionalCode = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? null : value),
  codeSchema.nullable().optional()
);

const productFields = {
  code: optionalCode,
  name: z.string().trim().min(1, "Nome e obrigatorio.").max(240),
  brand: brandSchema,
  specification: optionalString(4000),
  packaging: z.string().trim().min(1, "Embalagem e obrigatoria.").max(40),
  normalizedUnit: z
    .string()
    .trim()
    .min(1, "Unidade normalizada e obrigatoria.")
    .max(40)
    .optional()
    .default("UNIT"),
  lastPurchasePrice: optionalMoney,
  lastPurchaseSource: optionalString(160),
  lastSalePrice: optionalMoney,
  active: z.boolean().optional(),
};

export const createProductSchema = z.object(productFields);

export const updateProductSchema = z
  .object({
    code: nullableOptionalCode,
    name: productFields.name.optional(),
    brand: brandSchema.optional(),
    specification: nullableOptionalString(4000),
    packaging: productFields.packaging.optional(),
    normalizedUnit: productFields.normalizedUnit.optional(),
    lastPurchasePrice: nullableOptionalMoney,
    lastPurchaseSource: nullableOptionalString(160),
    lastSalePrice: nullableOptionalMoney,
    active: productFields.active,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const productParamsSchema = organizationParamsSchema.extend({
  productId: z.string().uuid(),
});

export const listProductsQuerySchema = z.object({
  search: optionalString(240),
  active: optionalBoolean,
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
