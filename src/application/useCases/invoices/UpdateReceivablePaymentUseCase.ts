import { ReceivablePayment } from "@application/entities/Invoice";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  ReceivablePaymentView,
  toReceivablePaymentView,
} from "@application/queries/types/InvoiceView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateReceivablePaymentUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UpdateReceivablePaymentUseCase.Input
  ): Promise<ReceivablePaymentView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [invoice, current] = await Promise.all([
      this.invoiceRepository.findOne(input),
      this.invoiceRepository.findPayment(input),
    ]);

    if (!invoice) {
      throw new NotFoundException("Nota fiscal nao encontrada.");
    }

    if (!current) {
      throw new NotFoundException("Recebimento nao encontrado.");
    }

    if (current.isCancelled) {
      throw new BadRequestException(
        "Um recebimento cancelado nao pode ser alterado."
      );
    }

    const updated = new ReceivablePayment({
      ...current,
      id: current.id,
      updatedByUserId: input.userId,
      receivedAt: input.receivedAt ?? current.receivedAt,
      amount: input.amount ?? current.amount,
      paymentMethod: input.paymentMethod ?? current.paymentMethod,
      reference:
        input.reference === null
          ? undefined
          : input.reference ?? current.reference,
      status: input.status ?? current.status,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      createdAt: current.createdAt,
    });
    const receivedWithoutCurrent =
      invoice.receivedAmount -
      (current.isCancelled ? 0 : current.amount);
    const receivedAfterUpdate =
      receivedWithoutCurrent +
      (updated.isCancelled ? 0 : updated.amount);

    if (
      receivedAfterUpdate >
      invoice.netReceivableAmount + 0.005
    ) {
      throw new BadRequestException(
        "O recebimento nao pode ultrapassar o saldo da nota."
      );
    }

    const saved = await this.invoiceRepository.updatePayment(updated);
    return toReceivablePaymentView(saved);
  }
}

export namespace UpdateReceivablePaymentUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    invoiceId: string;
    paymentId: string;
    receivedAt?: Date;
    amount?: number;
    paymentMethod?: string;
    reference?: string | null;
    status?: ReceivablePayment.Status;
    notes?: string | null;
  };
}
