import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import {
  nullableOptionalDate,
  nullableOptionalString,
  optionalDate,
  optionalString,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const nullableItemString = (max: number) =>
  nullableOptionalString(max).transform((value) => value ?? undefined);

const purchaseOrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  lineNumber: z.coerce.number().int().positive(),
  description: z.string().trim().min(1).max(4000),
  brand: z.string().trim().min(1).max(120),
  specification: nullableItemString(4000),
  originalUnit: z.string().trim().min(1).max(40),
  normalizedUnit: z.string().trim().min(1).max(40),
  orderedQuantity: z.coerce.number().positive().max(99_999_999_999),
  saleUnitPrice: z.coerce.number().nonnegative().max(9_999_999_999),
  officialTotal: z.coerce.number().nonnegative().max(9_999_999_999),
  notes: nullableItemString(4000),
});

const purchaseOrderItemsSchema = z
  .array(purchaseOrderItemSchema)
  .min(1, "A ordem deve possuir ao menos um item.")
  .superRefine((items, context) => {
    const lineNumbers = new Set<number>();

    items.forEach((item, index) => {
      if (lineNumbers.has(item.lineNumber)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "lineNumber"],
          message: "O numero da linha nao pode se repetir.",
        });
      }

      lineNumbers.add(item.lineNumber);
    });
  });

const requiredFields = {
  customerId: z.string().uuid(),
  orderNumber: z.string().trim().min(1).max(80),
  issuedAt: z.coerce.date(),
  officialTotal: z.coerce.number().nonnegative().max(9_999_999_999),
  items: purchaseOrderItemsSchema,
};

const optionalFields = {
  externalNumber: optionalString(80),
  quoteNumber: optionalString(80),
  requisitionNumber: optionalString(80),
  requestedDeliveryAt: optionalDate,
  paymentTerms: optionalString(4000),
  instructions: optionalString(8000),
  notes: optionalString(8000),
  billingAddress: optionalString(2000),
  deliveryAddress: optionalString(2000),
  lifecycleStatus: z.nativeEnum(PurchaseOrder.LifecycleStatus).optional(),
};

export const createPurchaseOrderSchema = z.object({
  ...requiredFields,
  ...optionalFields,
});

export const updatePurchaseOrderSchema = z
  .object({
    customerId: requiredFields.customerId.optional(),
    orderNumber: requiredFields.orderNumber.optional(),
    issuedAt: optionalDate,
    officialTotal: requiredFields.officialTotal.optional(),
    items: purchaseOrderItemsSchema.optional(),
    externalNumber: nullableOptionalString(80),
    quoteNumber: nullableOptionalString(80),
    requisitionNumber: nullableOptionalString(80),
    requestedDeliveryAt: nullableOptionalDate,
    paymentTerms: nullableOptionalString(4000),
    instructions: nullableOptionalString(8000),
    notes: nullableOptionalString(8000),
    billingAddress: nullableOptionalString(2000),
    deliveryAddress: nullableOptionalString(2000),
    lifecycleStatus: optionalFields.lifecycleStatus,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const purchaseOrderParamsSchema = organizationParamsSchema.extend({
  purchaseOrderId: z.string().uuid(),
});

export const listPurchaseOrdersQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  lifecycleStatus: z
    .nativeEnum(PurchaseOrder.LifecycleStatus)
    .optional(),
  search: optionalString(160),
});

export type CreatePurchaseOrderBody = z.infer<
  typeof createPurchaseOrderSchema
>;
export type UpdatePurchaseOrderBody = z.infer<
  typeof updatePurchaseOrderSchema
>;
export type PurchaseOrderParams = z.infer<typeof purchaseOrderParamsSchema>;
export type ListPurchaseOrdersQuery = z.infer<
  typeof listPurchaseOrdersQuerySchema
>;
