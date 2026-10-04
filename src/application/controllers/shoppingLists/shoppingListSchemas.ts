import { z } from "zod";
import { isoDateSchema } from "@application/controllers/schemas/isoDateSchema";
import { createAcquisitionSchema } from "@application/controllers/acquisitions/schemas/acquisitionSchemas";

const text = (max: number) => z.string().trim().max(max).nullable().optional().transform(value => value || null);
const id = z.string().uuid().nullable().optional().transform(value => value ?? null);

export const shoppingItemFields = z.object({
  url: z.string().trim().min(1).max(4000).url().refine(value => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
  }, "Informe um link de compra HTTP ou HTTPS válido, sem credenciais."),
  title: text(240),
  productId: id,
  purchaseOrderId: id,
  purchaseOrderItemId: id,
  quantity: z.number().positive().max(99_999_999_999).multipleOf(0.001).nullable().optional().transform(value => value ?? null),
  estimatedUnitPrice: z.number().nonnegative().max(9_999_999_999).nullable().optional().transform(value => value ?? null),
  sellerName: text(160),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  neededBy: isoDateSchema.nullable().optional().transform(value => value ?? null),
  notes: text(4000),
});
export const createShoppingListSchema = z.object({ name: z.string().trim().min(1).max(160), notes: text(4000) });
export const updateShoppingListSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  archived: z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0, "Informe ao menos um campo.");
export const addShoppingItemsSchema = z.object({ items: z.array(shoppingItemFields).min(1).max(100) });
export const updateShoppingItemSchema = shoppingItemFields.extend({ version: z.number().int().positive() });
export const checkShoppingItemSchema = z.object({ purchased: z.boolean(), version: z.number().int().positive() });
export const deleteShoppingItemSchema = z.object({ version: z.number().int().positive() });
export const purchaseShoppingItemSchema = z.object({ version: z.number().int().positive(), purchase: createAcquisitionSchema });
export const shoppingParamsSchema = z.object({ entityId: z.string().uuid(), shoppingListId: z.string().uuid().optional(), itemId: z.string().uuid().optional() });

export type ShoppingItemInput = z.infer<typeof shoppingItemFields>;
