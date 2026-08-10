import { Acquisition } from "@application/entities/Acquisition";
import {
  nullableOptionalString,
  nullableOptionalDate,
  optionalDate,
  optionalString,
} from "@application/controllers/v2Schemas";
import { purchaseOrderParamsSchema } from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import { organizationParamsSchema } from "@application/controllers/v2Schemas";
import { z } from "zod";

const moneySchema = z.coerce.number().nonnegative().max(9_999_999_999);
const paymentMethodSchema = z.nativeEnum(Acquisition.PaymentMethod);
const installmentCountSchema = z.coerce.number().int().min(1).max(36);

const acquisitionAllocationSchema = z.object({
  id: z.string().uuid().optional(),
  purchaseOrderItemId: z.string().uuid(),
  allocatedQuantity: z.coerce.number().positive().max(99_999_999_999),
  notes: optionalString(4000),
});

const acquisitionItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    purchaseOrderItemId: z.string().uuid().optional(),
    acquiredQuantity: z.coerce.number().positive().max(99_999_999_999),
    costUnitPrice: moneySchema,
    lineDiscount: moneySchema.optional().default(0),
    notes: optionalString(4000),
    allocations: z.array(acquisitionAllocationSchema).optional(),
  })
  .superRefine((value, context) => {
    const destinations = value.allocations?.map(
      (allocation) => allocation.purchaseOrderItemId
    );
    if (destinations && new Set(destinations).size !== destinations.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "A mesma destinacao nao pode se repetir no item.",
      });
    }
  });

const acquisitionItemsSchema = z
  .array(acquisitionItemSchema)
  .min(1, "A compra deve possuir ao menos um item.");

const manualStatusSchema = z.enum([
  Acquisition.Status.PLACED,
  Acquisition.Status.IN_TRANSIT,
  Acquisition.Status.CANCELLED,
]);

const requiredFields = {
  purchasedAt: z.coerce.date(),
  buyerName: z.string().trim().min(1).max(160),
  paymentMethod: paymentMethodSchema,
  items: acquisitionItemsSchema,
};

const optionalFields = {
  sellerName: optionalString(160),
  sellerDocument: optionalString(40),
  channel: optionalString(120),
  sellerOrderNumber: optionalString(120),
  paymentInstrument: optionalString(120),
  paymentHolder: optionalString(160),
  creditCardId: z.string().uuid().optional(),
  installmentCount: installmentCountSchema.optional().default(1),
  firstPaymentDueAt: optionalDate,
  shippingCost: moneySchema.optional().default(0),
  generalDiscount: moneySchema.optional().default(0),
  otherExpenses: moneySchema.optional().default(0),
  status: manualStatusSchema.optional(),
  notes: optionalString(8000),
};

export const createAcquisitionSchema = z
  .object({
    ...requiredFields,
    ...optionalFields,
  })
  .superRefine((value, context) => {
    if (
      value.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD &&
      !value.creditCardId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditCardId"],
        message: "Selecione o cartao utilizado.",
      });
    }

    if (
      (value.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD ||
        value.paymentMethod === Acquisition.PaymentMethod.BOLETO) &&
      !value.firstPaymentDueAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstPaymentDueAt"],
        message: "Informe o primeiro vencimento.",
      });
    }
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
    creditCardId: z.string().uuid().nullable().optional(),
    installmentCount: installmentCountSchema.optional(),
    firstPaymentDueAt: nullableOptionalDate,
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

export const supplierPurchaseParamsSchema = organizationParamsSchema.extend({
  acquisitionId: z.string().uuid(),
});

export const listSupplierPurchasesQuerySchema = z.object({
  search: optionalString(160),
  status: z.nativeEnum(Acquisition.Status).optional(),
});

export type CreateAcquisitionBody = z.infer<
  typeof createAcquisitionSchema
>;
export type UpdateAcquisitionBody = z.infer<
  typeof updateAcquisitionSchema
>;
export type AcquisitionParams = z.infer<typeof acquisitionParamsSchema>;
export type SupplierPurchaseParams = z.infer<
  typeof supplierPurchaseParamsSchema
>;
export type ListSupplierPurchasesQuery = z.infer<
  typeof listSupplierPurchasesQuerySchema
>;
