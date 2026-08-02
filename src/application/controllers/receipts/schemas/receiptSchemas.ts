import { AcquisitionReceipt } from "@application/entities/AcquisitionReceipt";
import { acquisitionParamsSchema } from "@application/controllers/acquisitions/schemas/acquisitionSchemas";
import {
  nullableOptionalString,
  optionalDate,
  optionalString,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const receiptItemSchema = z.object({
  id: z.string().uuid().optional(),
  acquisitionItemId: z.string().uuid(),
  purchaseOrderItemId: z.string().uuid(),
  receivedQuantity: z.coerce.number().positive().max(99_999_999_999),
  notes: optionalString(4000),
});

const receiptItemsSchema = z
  .array(receiptItemSchema)
  .min(1, "O recebimento deve possuir ao menos um item.");

export const createReceiptSchema = z.object({
  receivedAt: z.coerce.date(),
  notes: optionalString(8000),
  items: receiptItemsSchema,
});

export const updateReceiptSchema = z
  .object({
    receivedAt: optionalDate,
    status: z.nativeEnum(AcquisitionReceipt.Status).optional(),
    notes: nullableOptionalString(8000),
    items: receiptItemsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const receiptParamsSchema = acquisitionParamsSchema.extend({
  receiptId: z.string().uuid(),
});

export type CreateReceiptBody = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptBody = z.infer<typeof updateReceiptSchema>;
export type ReceiptParams = z.infer<typeof receiptParamsSchema>;
