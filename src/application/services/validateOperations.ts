import { Acquisition } from "@application/entities/Acquisition";
import { AcquisitionReceipt } from "@application/entities/AcquisitionReceipt";
import { Delivery } from "@application/entities/Delivery";
import { Invoice } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";

const QUANTITY_TOLERANCE = 0.0005;

export function acquisitionReceiptItemKey(
  acquisitionItemId: string,
  purchaseOrderItemId: string
): string {
  return `${acquisitionItemId}:${purchaseOrderItemId}`;
}

export function validateReceipt(
  receipt: AcquisitionReceipt,
  acquisition: Acquisition,
  previouslyReceivedByAcquisitionItem: Map<string, number>
): void {
  if (receipt.items.length === 0) {
    throw new BadRequestException(
      "O recebimento deve possuir ao menos um item."
    );
  }

  if (acquisition.isCancelled) {
    throw new BadRequestException(
      "Nao e possivel receber uma aquisicao cancelada."
    );
  }

  const acquisitionItemsById = new Map(
    acquisition.items.map((item) => [item.id, item])
  );
  const seen = new Set<string>();

  receipt.items.forEach((item) => {
    const acquisitionItem = acquisitionItemsById.get(
      item.acquisitionItemId
    );
    const allocation = acquisitionItem?.allocations.find(
      (candidate) =>
        candidate.purchaseOrderItemId === item.purchaseOrderItemId
    );

    if (!acquisitionItem || !allocation) {
      throw new BadRequestException(
        "O recebimento possui um item que nao pertence a aquisicao."
      );
    }

    const receiptItemKey = acquisitionReceiptItemKey(
      item.acquisitionItemId,
      item.purchaseOrderItemId
    );
    if (seen.has(receiptItemKey)) {
      throw new BadRequestException(
        "A destinacao do item nao pode se repetir no recebimento."
      );
    }
    seen.add(receiptItemKey);

    if (item.receivedQuantity <= 0) {
      throw new BadRequestException(
        "A quantidade recebida deve ser maior que zero."
      );
    }

    const totalAfterReceipt =
      (previouslyReceivedByAcquisitionItem.get(receiptItemKey) ?? 0) +
      item.receivedQuantity;

    if (
      totalAfterReceipt >
      allocation.allocatedQuantity + QUANTITY_TOLERANCE
    ) {
      throw new BadRequestException(
        "A quantidade recebida nao pode ultrapassar a quantidade destinada."
      );
    }
  });
}

export function validateDelivery(
  delivery: Delivery,
  order: PurchaseOrder,
  previouslyCommittedByOrderItem: Map<string, number>
): void {
  if (delivery.items.length === 0) {
    throw new BadRequestException(
      "A entrega deve possuir ao menos um item."
    );
  }

  if (
    delivery.status === Delivery.Status.DISPATCHED &&
    !delivery.dispatchedAt
  ) {
    throw new BadRequestException(
      "Informe a data de envio para uma entrega despachada."
    );
  }

  if (
    delivery.status === Delivery.Status.DELIVERED &&
    !delivery.deliveredAt
  ) {
    throw new BadRequestException(
      "Informe a data de conclusao para uma entrega realizada."
    );
  }

  const orderItemsById = new Map(order.items.map((item) => [item.id, item]));
  const seen = new Set<string>();

  delivery.items.forEach((item) => {
    const orderItem = orderItemsById.get(item.purchaseOrderItemId);

    if (!orderItem) {
      throw new BadRequestException(
        "A entrega possui um item que nao pertence a ordem."
      );
    }

    if (seen.has(item.purchaseOrderItemId)) {
      throw new BadRequestException(
        "O item da ordem nao pode se repetir na entrega."
      );
    }
    seen.add(item.purchaseOrderItemId);

    if (item.deliveredQuantity <= 0) {
      throw new BadRequestException(
        "A quantidade da entrega deve ser maior que zero."
      );
    }

    const totalAfterDelivery =
      (previouslyCommittedByOrderItem.get(item.purchaseOrderItemId) ?? 0) +
      item.deliveredQuantity;
    const availableQuantity = Math.min(
      orderItem.receivedQuantity,
      orderItem.orderedQuantity
    );

    if (totalAfterDelivery > availableQuantity + QUANTITY_TOLERANCE) {
      throw new BadRequestException(
        "A entrega nao pode ultrapassar a quantidade recebida e contratada."
      );
    }
  });
}

export function validateInvoice(
  invoice: Invoice,
  order: PurchaseOrder,
  previouslyInvoicedByOrderItem: Map<string, number>
): void {
  if (invoice.items.length === 0) {
    throw new BadRequestException(
      "A nota fiscal deve possuir ao menos um item."
    );
  }

  if (invoice.dueAt.getTime() < invoice.issuedAt.getTime()) {
    throw new BadRequestException(
      "O vencimento nao pode ser anterior a emissao da nota."
    );
  }

  if (invoice.otherDeductions > invoice.grossAmount) {
    throw new BadRequestException(
      "As deducoes nao podem ultrapassar o valor bruto da nota."
    );
  }

  const orderItemsById = new Map(order.items.map((item) => [item.id, item]));
  const seen = new Set<string>();

  invoice.items.forEach((item) => {
    const orderItem = orderItemsById.get(item.purchaseOrderItemId);

    if (!orderItem) {
      throw new BadRequestException(
        "A nota possui um item que nao pertence a ordem."
      );
    }

    if (seen.has(item.purchaseOrderItemId)) {
      throw new BadRequestException(
        "O item da ordem nao pode se repetir na nota."
      );
    }
    seen.add(item.purchaseOrderItemId);

    if (item.invoicedQuantity <= 0 || item.unitPrice < 0) {
      throw new BadRequestException(
        "Quantidade e preco da nota devem possuir valores validos."
      );
    }

    const totalAfterInvoice =
      (previouslyInvoicedByOrderItem.get(item.purchaseOrderItemId) ?? 0) +
      item.invoicedQuantity;

    if (
      totalAfterInvoice >
      orderItem.committedDeliveryQuantity + QUANTITY_TOLERANCE
    ) {
      throw new BadRequestException(
        "A nota nao pode faturar alem da quantidade separada para entrega."
      );
    }
  });
}
