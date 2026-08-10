import { Acquisition } from "@application/entities/Acquisition";
import { BadRequestException } from "@application/errors/http/BadRequestException";

const manuallyManagedStatuses = new Set([
  Acquisition.Status.PLACED,
  Acquisition.Status.IN_TRANSIT,
  Acquisition.Status.CANCELLED,
]);

export function validateAcquisition(
  acquisition: Acquisition
): void {
  if (
    !Object.values(Acquisition.PaymentMethod).includes(
      acquisition.paymentMethod as Acquisition.PaymentMethod
    )
  ) {
    throw new BadRequestException("Forma de pagamento invalida.");
  }

  if (
    acquisition.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD &&
    (!acquisition.creditCardId || !acquisition.firstPaymentDueAt)
  ) {
    throw new BadRequestException(
      "Compras no cartao exigem cartao e primeiro vencimento."
    );
  }

  if (
    acquisition.paymentMethod === Acquisition.PaymentMethod.BOLETO &&
    !acquisition.firstPaymentDueAt
  ) {
    throw new BadRequestException("Informe o vencimento do boleto.");
  }
  if (!manuallyManagedStatuses.has(acquisition.status)) {
    throw new BadRequestException(
      "A situacao informada depende dos recebimentos da aquisicao."
    );
  }

  if (
    acquisition.paymentMethod === Acquisition.PaymentMethod.DEBIT_CARD &&
    acquisition.paymentInstrument
  ) {
    const digitCount =
      acquisition.paymentInstrument.match(/\d/g)?.length ?? 0;

    if (digitCount > 4) {
      throw new BadRequestException(
        "A identificacao do pagamento pode conter no maximo quatro digitos."
      );
    }
  }

  acquisition.items.forEach((item) => {
    if (item.lineDiscount > item.grossCost) {
      throw new BadRequestException(
        "O desconto de um item nao pode superar seu custo bruto."
      );
    }

    const destinationIds = new Set<string>();
    item.allocations.forEach((allocation) => {
      if (allocation.allocatedQuantity <= 0) {
        throw new BadRequestException(
          "A quantidade destinada deve ser maior que zero."
        );
      }
      if (destinationIds.has(allocation.purchaseOrderItemId)) {
        throw new BadRequestException(
          "Uma destinacao nao pode se repetir no mesmo item comprado."
        );
      }
      destinationIds.add(allocation.purchaseOrderItemId);
    });

    if (item.allocatedQuantity > item.acquiredQuantity + 0.0005) {
      throw new BadRequestException(
        "A quantidade destinada nao pode superar a quantidade comprada."
      );
    }
  });

  if (acquisition.totalCost < 0) {
    throw new BadRequestException(
      "O desconto geral nao pode superar o custo total da aquisicao."
    );
  }
}
