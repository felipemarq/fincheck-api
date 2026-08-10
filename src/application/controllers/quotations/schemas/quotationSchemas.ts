import { Quotation } from "@application/entities/Quotation";
import {
  optionalDate,
  optionalString,
  organizationParamsSchema,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const optionalEmail = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().email().max(254).optional()
);

const quotationItemSchema = z.object({
  productId: z.string().uuid(),
  lineNumber: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive().max(99_999_999_999),
  unitPrice: z.coerce.number().nonnegative().max(9_999_999_999),
  notes: optionalString(4000),
});

const updateQuotationItemSchema = quotationItemSchema.extend({
  id: z.string().uuid().optional(),
});

function validateQuotationItems(
  items: Array<{ lineNumber: number; id?: string }>,
  context: z.RefinementCtx
) {
  const lines = new Set<number>();
  const ids = new Set<string>();

  items.forEach((item, index) => {
    if (lines.has(item.lineNumber)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "lineNumber"],
        message: "O numero da linha nao pode se repetir.",
      });
    }
    lines.add(item.lineNumber);

    if (item.id) {
      if (ids.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "id"],
          message: "O item da cotacao nao pode se repetir.",
        });
      }
      ids.add(item.id);
    }
  });
}

const quotationItemsSchema = z
  .array(quotationItemSchema)
  .min(1, "A cotacao deve possuir ao menos um item.")
  .superRefine(validateQuotationItems);

const updateQuotationItemsSchema = z
  .array(updateQuotationItemSchema)
  .min(1, "A cotacao deve possuir ao menos um item.")
  .superRefine(validateQuotationItems);

const quotationFields = {
  customerId: z.string().uuid(),
  number: z.string().trim().min(1).max(80),
  status: z.nativeEnum(Quotation.Status).optional(),
  issuedAt: z.coerce.date(),
  validUntil: optionalDate,
  sellerName: z.string().trim().min(1).max(160),
  sellerDocument: optionalString(40),
  sellerEmail: optionalEmail,
  sellerPhone: optionalString(40),
  sellerAddress: optionalString(2000),
  customerAddress: optionalString(2000),
  paymentTerms: optionalString(4000),
  deliveryTerms: optionalString(4000),
  notes: optionalString(8000),
  internalNotes: optionalString(8000),
  freight: z.coerce.number().nonnegative().max(9_999_999_999).default(0),
  discount: z.coerce.number().nonnegative().max(9_999_999_999).default(0),
};

export const createQuotationSchema = z.object({
  ...quotationFields,
  items: quotationItemsSchema,
});

export const updateQuotationSchema = z.object({
  ...quotationFields,
  items: updateQuotationItemsSchema,
});

export const quotationParamsSchema = organizationParamsSchema.extend({
  quotationId: z.string().uuid(),
});

export const quotationItemParamsSchema = quotationParamsSchema.extend({
  quotationItemId: z.string().uuid(),
});

export const quotationImageParamsSchema = quotationParamsSchema.extend({
  imageId: z.string().uuid(),
});

export const listQuotationsQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(Quotation.Status).optional(),
  search: optionalString(160),
});

export const uploadQuotationImageSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataBase64: z.string().min(1).max(4_300_000),
});

export type CreateQuotationBody = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationBody = z.infer<typeof updateQuotationSchema>;
export type QuotationParams = z.infer<typeof quotationParamsSchema>;
export type QuotationItemParams = z.infer<typeof quotationItemParamsSchema>;
export type QuotationImageParams = z.infer<typeof quotationImageParamsSchema>;
export type ListQuotationsQuery = z.infer<typeof listQuotationsQuerySchema>;
export type UploadQuotationImageBody = z.infer<
  typeof uploadQuotationImageSchema
>;
