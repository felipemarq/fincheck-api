import { z } from "zod";
import {
  nullableOptionalString,
  optionalBoolean,
  optionalString,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";

const customerFields = {
  legalName: z
    .string({ required_error: "Razao social e obrigatoria." })
    .trim()
    .min(1, "Razao social e obrigatoria.")
    .max(160),
  tradeName: optionalString(160),
  document: z
    .string({ required_error: "Documento e obrigatorio." })
    .trim()
    .min(1, "Documento e obrigatorio.")
    .max(40),
  email: z.preprocess(
    (value) =>
      typeof value === "string" && !value.trim() ? undefined : value,
    z.string().trim().email("Informe um e-mail valido.").max(254).optional()
  ),
  phone: optionalString(40),
  billingAddress: optionalString(2000),
  deliveryAddress: optionalString(2000),
  notes: optionalString(4000),
  active: z.boolean().optional(),
};

export const createCustomerSchema = z.object(customerFields);

export const updateCustomerSchema = z
  .object({
    legalName: customerFields.legalName.optional(),
    tradeName: nullableOptionalString(160),
    document: customerFields.document.optional(),
    email: z
      .string()
      .trim()
      .email("Informe um e-mail valido.")
      .max(254)
      .nullable()
      .optional(),
    phone: nullableOptionalString(40),
    billingAddress: nullableOptionalString(2000),
    deliveryAddress: nullableOptionalString(2000),
    notes: nullableOptionalString(4000),
    active: customerFields.active,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const customerParamsSchema = organizationParamsSchema.extend({
  customerId: z.string().uuid(),
});

export const listCustomersQuerySchema = z.object({
  search: optionalString(160),
  active: optionalBoolean,
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;
export type CustomerParams = z.infer<typeof customerParamsSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
