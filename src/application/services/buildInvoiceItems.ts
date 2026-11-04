import { InvoiceItem } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";

export type InvoiceItemInput = {
  id?: string;
  purchaseOrderItemId?: string;
  description?: string;
  originalUnit?: string;
  invoicedQuantity: number;
  unitPrice: number;
  notes?: string;
};

/** Store the fiscal description at creation, independently of later OC edits. */
export function buildInvoiceItems(
  items: InvoiceItemInput[],
  entityId: string,
  order?: PurchaseOrder,
  invoiceId?: string,
  currentItems: InvoiceItem[] = [],
): InvoiceItem[] {
  return items.map((item, index) => {
    const current = currentItems.find((candidate) => candidate.id === item.id);
    if (item.id && !current) {
      throw new BadRequestException(
        "O item informado nao pertence a esta nota.",
      );
    }
    const orderItem = order?.items.find(
      (candidate) => candidate.id === item.purchaseOrderItemId,
    );
    const sameOrderItem =
      current?.purchaseOrderItemId === item.purchaseOrderItemId;
    return new InvoiceItem({
      ...item,
      entityId,
      invoiceId,
      lineNumber: orderItem?.lineNumber ?? index + 1,
      description: order
        ? ((sameOrderItem ? current?.description : undefined) ??
          orderItem?.description)
        : item.description?.trim(),
      originalUnit: order
        ? ((sameOrderItem ? current?.originalUnit : undefined) ??
          orderItem?.originalUnit)
        : item.originalUnit?.trim(),
    });
  });
}
