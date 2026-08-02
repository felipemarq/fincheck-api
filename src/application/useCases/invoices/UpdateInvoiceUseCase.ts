import { Invoice, InvoiceItem } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  InvoiceView,
  toInvoiceView,
} from "@application/queries/types/InvoiceView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { validateInvoice } from "@application/services/validateOperations";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: UpdateInvoiceUseCase.Input): Promise<InvoiceView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, current] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.invoiceRepository.findOne(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (!current) {
      throw new NotFoundException("Nota fiscal nao encontrada.");
    }

    if (current.status === Invoice.Status.CANCELLED) {
      throw new BadRequestException(
        "Uma nota cancelada nao pode ser alterada."
      );
    }

    if (
      orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam alteracoes operacionais."
      );
    }

    if (current.receivedAmount > 0 && this.changesFinancialData(input)) {
      throw new BadRequestException(
        "Uma nota com recebimentos permite alterar apenas vencimento e observacoes."
      );
    }

    const invoiceNumber = input.invoiceNumber ?? current.invoiceNumber;

    if (invoiceNumber !== current.invoiceNumber) {
      const duplicate = await this.invoiceRepository.findByNumber({
        entityId: input.entityId,
        invoiceNumber,
        exceptInvoiceId: current.id,
      });

      if (duplicate) {
        throw new ConflictException(
          "Ja existe uma nota fiscal com este numero."
        );
      }
    }

    const items = input.items
      ? input.items.map(
          (item) =>
            new InvoiceItem({
              ...item,
              entityId: input.entityId,
              invoiceId: current.id,
            })
        )
      : current.items;
    const updated = new Invoice({
      ...current,
      id: current.id,
      updatedByUserId: input.userId,
      invoiceNumber,
      issuedAt: input.issuedAt ?? current.issuedAt,
      dueAt: input.dueAt ?? current.dueAt,
      taxAmount: input.taxAmount ?? current.taxAmount,
      otherDeductions:
        input.otherDeductions ?? current.otherDeductions,
      status: input.status ?? current.status,
      notes:
        input.notes === null ? undefined : input.notes ?? current.notes,
      items,
      payments: current.payments,
      createdAt: current.createdAt,
    });

    if (updated.status !== Invoice.Status.CANCELLED) {
      const previous =
        await this.invoiceRepository.getInvoicedQuantityByOrderItem({
          ...input,
          exceptInvoiceId: current.id,
        });
      validateInvoice(updated, orderRecord.order, previous);
    }

    const saved = await this.invoiceRepository.update(updated);
    return toInvoiceView(saved, orderRecord.order.items);
  }

  private changesFinancialData(input: UpdateInvoiceUseCase.Input): boolean {
    return Boolean(
      input.invoiceNumber !== undefined ||
        input.issuedAt !== undefined ||
        input.taxAmount !== undefined ||
        input.otherDeductions !== undefined ||
        input.status !== undefined ||
        input.items !== undefined
    );
  }
}

export namespace UpdateInvoiceUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    invoiceId: string;
    invoiceNumber?: string;
    issuedAt?: Date;
    dueAt?: Date;
    taxAmount?: number;
    otherDeductions?: number;
    status?: Invoice.Status;
    notes?: string | null;
    items?: Array<{
      id?: string;
      purchaseOrderItemId: string;
      invoicedQuantity: number;
      unitPrice: number;
      notes?: string;
    }>;
  };
}
