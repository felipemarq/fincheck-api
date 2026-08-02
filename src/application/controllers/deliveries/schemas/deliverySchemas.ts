import { Delivery } from "@application/entities/Delivery";
import { purchaseOrderParamsSchema } from "@application/controllers/purchaseOrders/schemas/purchaseOrderSchemas";
import {
  nullableOptionalDate,
  nullableOptionalString,
  optionalString,
} from "@application/controllers/v2Schemas";
import { z } from "zod";

const moneySchema = z.coerce.number().nonnegative().max(9_999_999_999);
const nullableCreateString = (max: number) =>
  nullableOptionalString(max).transform((value) => value ?? undefined);

const deliveryItemSchema = z.object({
  id: z.string().uuid().optional(),
  purchaseOrderItemId: z.string().uuid(),
  deliveredQuantity: z.coerce.number().positive().max(99_999_999_999),
  notes: optionalString(4000),
});

const deliveryItemsSchema = z
  .array(deliveryItemSchema)
  .min(1, "A entrega deve possuir ao menos um item.");

export const createDeliverySchema = z.object({
  status: z.nativeEnum(Delivery.Status).optional(),
  dispatchedAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
  freightCost: moneySchema.optional().default(0),
  notes: nullableCreateString(8000),
  items: deliveryItemsSchema,
});

export const updateDeliverySchema = z
  .object({
    status: z.nativeEnum(Delivery.Status).optional(),
    dispatchedAt: nullableOptionalDate,
    deliveredAt: nullableOptionalDate,
    freightCost: moneySchema.optional(),
    notes: nullableOptionalString(8000),
    items: deliveryItemsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const deliveryParamsSchema = purchaseOrderParamsSchema.extend({
  deliveryId: z.string().uuid(),
});

export type CreateDeliveryBody = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryBody = z.infer<typeof updateDeliverySchema>;
export type DeliveryParams = z.infer<typeof deliveryParamsSchema>;
