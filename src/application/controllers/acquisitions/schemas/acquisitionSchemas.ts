import { Acquisition } from "@application/entities/Acquisition";
import {
  nullableOptionalString,
  optionalDate,
  optionalString,
} from "@application/controllers/v2Schemas";
import { purchaseOrderParamsSchema } from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { z } from "zod";

const moneySchema = z.coerce.number().nonnegative().max(9_999_999_999);

const acquisitionItemSchema = z.object({
  id: z.string().uuid().optional(),
  purchaseOrderItemId: z.string().uuid(),
  acquiredQuantity: z.coerce.number().positive().max(99_999_999_999),
  costUnitPrice: moneySchema,
  lineDiscount: moneySchema.optional().default(0),
  notes: optionalString(4000),
});

const acquisitionItemsSchema = z
  .array(acquisitionItemSchema)
  .min(1, "A aquisicao deve possuir ao menos um item.")
  .superRefine((items, context) => {
    const purchaseOrderItemIds = new Set<string>();

    items.forEach((item, index) => {
      if (purchaseOrderItemIds.has(item.purchaseOrderItemId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "purchaseOrderItemId"],
          message: "O item da ordem nao pode se repetir.",
        });
      }

      purchaseOrderItemIds.add(item.purchaseOrderItemId);
    });
  });

const manualStatusSchema = z.enum([
  Acquisition.Status.PLACED,
  Acquisition.Status.IN_TRANSIT,
  Acquisition.Status.CANCELLED,
]);

const requiredFields = {
  purchasedAt: z.coerce.date(),
  buyerName: z.string().trim().min(1).max(160),
  paymentMethod: z.string().trim().min(1).max(80),
  items: acquisitionItemsSchema,
};

const optionalFields = {
  sellerName: optionalString(160),
  sellerDocument: optionalString(40),
  channel: optionalString(120),
  sellerOrderNumber: optionalString(120),
  paymentInstrument: optionalString(120),
  paymentHolder: optionalString(160),
  shippingCost: moneySchema.optional().default(0),
  generalDiscount: moneySchema.optional().default(0),
  otherExpenses: moneySchema.optional().default(0),
  status: manualStatusSchema.optional(),
  notes: optionalString(8000),
};

export const createAcquisitionSchema = z.object({
  ...requiredFields,
  ...optionalFields,
});

export const updateAcquisitionSchema = z
  .object({
    purchasedAt: optionalDate,
    buyerName: requiredFields.buyerName.optional(),
    paymentMethod: requiredFields.paymentMethod.optional(),
    items: acquisitionItemsSchema.optional(),
    sellerName: nullableOptionalString(160),
    sellerDocument: nullableOptionalString(40),
    channel: nullableOptionalString(120),
    sellerOrderNumber: nullableOptionalString(120),
    paymentInstrument: nullableOptionalString(120),
    paymentHolder: nullableOptionalString(160),
    shippingCost: moneySchema.optional(),
    generalDiscount: moneySchema.optional(),
    otherExpenses: moneySchema.optional(),
    status: manualStatusSchema.optional(),
    notes: nullableOptionalString(8000),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const acquisitionParamsSchema = purchaseOrderParamsSchema.extend({
  acquisitionId: z.string().uuid(),
});

export type CreateAcquisitionBody = z.infer<
  typeof createAcquisitionSchema
>;
export type UpdateAcquisitionBody = z.infer<
  typeof updateAcquisitionSchema
>;
export type AcquisitionParams = z.infer<typeof acquisitionParamsSchema>;
