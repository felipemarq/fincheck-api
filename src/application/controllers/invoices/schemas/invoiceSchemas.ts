import {
  Invoice,
  ReceivablePayment,
} from "@application/entities/Invoice";
import { purchaseOrderParamsSchema } from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import {
  nullableOptionalString,
  optionalDate,
  optionalString,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const moneySchema = z.coerce.number().nonnegative().max(9_999_999_999);

const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  purchaseOrderItemId: z.string().uuid(),
  invoicedQuantity: z.coerce.number().positive().max(99_999_999_999),
  unitPrice: moneySchema,
  notes: optionalString(4000),
});

const invoiceItemsSchema = z
  .array(invoiceItemSchema)
  .min(1, "A nota deve possuir ao menos um item.");

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(120),
  issuedAt: z.coerce.date(),
  dueAt: z.coerce.date(),
  taxAmount: moneySchema.optional().default(0),
  otherDeductions: moneySchema.optional().default(0),
  status: z.nativeEnum(Invoice.Status).optional(),
  notes: optionalString(8000),
  items: invoiceItemsSchema,
});

export const updateInvoiceSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1).max(120).optional(),
    issuedAt: optionalDate,
    dueAt: optionalDate,
    taxAmount: moneySchema.optional(),
    otherDeductions: moneySchema.optional(),
    status: z.nativeEnum(Invoice.Status).optional(),
    notes: nullableOptionalString(8000),
    items: invoiceItemsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const createReceivablePaymentSchema = z.object({
  receivedAt: z.coerce.date(),
  amount: z.coerce.number().positive().max(9_999_999_999),
  paymentMethod: z.string().trim().min(1).max(80),
  reference: optionalString(160),
  notes: optionalString(4000),
});

export const updateReceivablePaymentSchema = z
  .object({
    receivedAt: optionalDate,
    amount: z.coerce.number().positive().max(9_999_999_999).optional(),
    paymentMethod: z.string().trim().min(1).max(80).optional(),
    reference: nullableOptionalString(160),
    status: z.nativeEnum(ReceivablePayment.Status).optional(),
    notes: nullableOptionalString(4000),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const invoiceParamsSchema = purchaseOrderParamsSchema.extend({
  invoiceId: z.string().uuid(),
});

export const receivablePaymentParamsSchema = invoiceParamsSchema.extend({
  paymentId: z.string().uuid(),
});

export type CreateInvoiceBody = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceBody = z.infer<typeof updateInvoiceSchema>;
export type CreateReceivablePaymentBody = z.infer<
  typeof createReceivablePaymentSchema
>;
export type UpdateReceivablePaymentBody = z.infer<
  typeof updateReceivablePaymentSchema
>;
export type InvoiceParams = z.infer<typeof invoiceParamsSchema>;
export type ReceivablePaymentParams = z.infer<
  typeof receivablePaymentParamsSchema
>;
