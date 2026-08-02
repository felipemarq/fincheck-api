import {
  Invoice,
  ReceivablePayment,
} from "@application/entities/Invoice";
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
export class CreateReceivablePaymentUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: CreateReceivablePaymentUseCase.Input
  ): Promise<ReceivablePaymentView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const invoice = await this.invoiceRepository.findOne(input);

    if (!invoice) {
      throw new NotFoundException("Nota fiscal nao encontrada.");
    }

    if (invoice.status !== Invoice.Status.ISSUED) {
      throw new BadRequestException(
        "Somente notas emitidas aceitam recebimentos."
      );
    }

    if (input.amount > invoice.outstandingAmount + 0.005) {
      throw new BadRequestException(
        "O recebimento nao pode ultrapassar o saldo da nota."
      );
    }

    const payment = new ReceivablePayment({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
    });
    const created = await this.invoiceRepository.createPayment(payment);

    return toReceivablePaymentView(created);
  }
}

export namespace CreateReceivablePaymentUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    invoiceId: string;
    receivedAt: Date;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  };
}
