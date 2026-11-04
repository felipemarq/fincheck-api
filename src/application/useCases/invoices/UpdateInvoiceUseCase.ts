import { Invoice } from "@application/entities/Invoice";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  InvoiceView,
  toInvoiceView,
} from "@application/queries/types/InvoiceView";
import { FinancialAccessService } from "@application/services/FinancialAccessService";
import { validateInvoice } from "@application/services/validateOperations";
import { validateInvoiceReference } from "@application/services/validateInvoiceReference";
import { buildInvoiceItems, InvoiceItemInput } from "@application/services/buildInvoiceItems";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly financialAccessService: FinancialAccessService,
    private readonly customerRepository: CustomerRepository
  ) {}

  async execute(input: UpdateInvoiceUseCase.Input): Promise<InvoiceView> {
    await this.financialAccessService.assertUserAccess(
      input.entityId,
      input.userId,
      "invoices.manage"
    );

    const current = await this.invoiceRepository.findOne(input);
    if (!current) {
      throw new NotFoundException("Nota fiscal nao encontrada.");
    }

    const orderRecord = current.purchaseOrderId
      ? await this.purchaseOrderRepository.findOne({ entityId: input.entityId, purchaseOrderId: current.purchaseOrderId })
      : null;
    if (current.purchaseOrderId && !orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (current.status === Invoice.Status.CANCELLED) {
      throw new BadRequestException(
        "Uma nota cancelada nao pode ser alterada."
      );
    }

    if (
      orderRecord && orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam alteracoes operacionais."
      );
    }

    if ((current.receivedAmount > 0 || current.returnedAmount > 0) && this.changesFinancialData(input)) {
      throw new BadRequestException(
        "Uma nota com recebimentos ou devolucoes permite alterar apenas vencimento e observacoes."
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

    const customerId = input.customerId ?? current.customerId ?? orderRecord?.order.customerId;
    if (input.customerId) {
      if (orderRecord && input.customerId !== orderRecord.order.customerId) {
        throw new BadRequestException("O cliente da nota deve ser o mesmo da OC.");
      }
      if (!await this.customerRepository.findOne({ entityId: input.entityId, customerId: input.customerId })) {
        throw new NotFoundException("Cliente nao encontrado nesta empresa.");
      }
    }
    const items = input.items
      ? buildInvoiceItems(input.items, input.entityId, orderRecord?.order, current.id, current.items)
      : current.items;
    const updated = new Invoice({
      ...current,
      customerId,
      operationType: input.operationType ?? current.operationType,
      referencedInvoiceId: input.referencedInvoiceId === null ? undefined : input.referencedInvoiceId ?? current.referencedInvoiceId,
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
        current.purchaseOrderId ? await this.invoiceRepository.getInvoicedQuantityByOrderItem({
          entityId: input.entityId,
          purchaseOrderId: current.purchaseOrderId,
          exceptInvoiceId: current.id,
        }) : new Map<string, number>();
      validateInvoice(updated, orderRecord?.order, previous);
    }

    if (!updated.isSale && updated.purchaseOrderId) throw new BadRequestException("Cadastre devolucoes como notas avulsas.");
    await validateInvoiceReference(updated, this.invoiceRepository, current);
    const saved = await this.invoiceRepository.update(updated);
    return toInvoiceView(saved, orderRecord?.order.items);
  }

  private changesFinancialData(input: UpdateInvoiceUseCase.Input): boolean {
    return Boolean(
      input.invoiceNumber !== undefined ||
        input.customerId !== undefined ||
        input.operationType !== undefined ||
        input.referencedInvoiceId !== undefined ||
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
    purchaseOrderId?: string;
    customerId?: string;
    operationType?: Invoice.OperationType;
    referencedInvoiceId?: string | null;
    invoiceId: string;
    invoiceNumber?: string;
    issuedAt?: Date;
    dueAt?: Date;
    taxAmount?: number;
    otherDeductions?: number;
    status?: Invoice.Status;
    notes?: string | null;
    items?: InvoiceItemInput[];
  };
}
