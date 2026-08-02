import { Acquisition } from "@application/entities/Acquisition";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";

const manuallyManagedStatuses = new Set([
  Acquisition.Status.PLACED,
  Acquisition.Status.IN_TRANSIT,
  Acquisition.Status.CANCELLED,
]);

export function validateAcquisition(
  acquisition: Acquisition,
  order: PurchaseOrder
): void {
  if (!manuallyManagedStatuses.has(acquisition.status)) {
    throw new BadRequestException(
      "A situacao informada depende dos recebimentos da aquisicao."
    );
  }

  if (acquisition.paymentInstrument) {
    const digitCount =
      acquisition.paymentInstrument.match(/\d/g)?.length ?? 0;

    if (digitCount > 4) {
      throw new BadRequestException(
        "A identificacao do pagamento pode conter no maximo quatro digitos."
      );
    }
  }

  const orderItemIds = new Set(
    order.items.flatMap((item) => (item.id ? [item.id] : []))
  );
  const acquisitionItemIds = new Set<string>();

  acquisition.items.forEach((item) => {
    if (!orderItemIds.has(item.purchaseOrderItemId)) {
      throw new BadRequestException(
        "Todos os itens adquiridos devem pertencer a ordem informada."
      );
    }

    if (acquisitionItemIds.has(item.purchaseOrderItemId)) {
      throw new BadRequestException(
        "Um item da ordem nao pode se repetir na mesma aquisicao."
      );
    }

    if (item.lineDiscount > item.grossCost) {
      throw new BadRequestException(
        "O desconto de um item nao pode superar seu custo bruto."
      );
    }

    acquisitionItemIds.add(item.purchaseOrderItemId);
  });

  if (acquisition.totalCost < 0) {
    throw new BadRequestException(
      "O desconto geral nao pode superar o custo total da aquisicao."
    );
  }
}
