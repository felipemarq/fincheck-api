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
import { buildInvoiceItems, InvoiceItemInput } from "@application/services/buildInvoiceItems";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly financialAccessService: FinancialAccessService,
    private readonly customerRepository: CustomerRepository
  ) {}

  async execute(input: CreateInvoiceUseCase.Input): Promise<InvoiceView> {
    await this.financialAccessService.assertUserAccess(
      input.entityId,
      input.userId,
      "invoices.manage"
    );

    const [orderRecord, existing] = await Promise.all([
      input.purchaseOrderId
        ? this.purchaseOrderRepository.findOne({ entityId: input.entityId, purchaseOrderId: input.purchaseOrderId })
        : Promise.resolve(null),
      this.invoiceRepository.findByNumber(input),
    ]);

    if (input.purchaseOrderId && !orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (existing) {
      throw new ConflictException(
        "Ja existe uma nota fiscal com este numero."
      );
    }

    if (
      orderRecord && orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam notas fiscais."
      );
    }

    const customerId = orderRecord?.order.customerId ?? input.customerId;
    if (!customerId) {
      throw new BadRequestException("Informe o cliente da nota fiscal.");
    }
    if (orderRecord && input.customerId && input.customerId !== customerId) {
      throw new BadRequestException("O cliente da nota deve ser o mesmo da OC.");
    }
    if (!orderRecord && !await this.customerRepository.findOne({ entityId: input.entityId, customerId })) {
      throw new NotFoundException("Cliente nao encontrado nesta empresa.");
    }

    const invoice = new Invoice({
      ...input,
      customerId,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: buildInvoiceItems(input.items, input.entityId, orderRecord?.order),
    });
    const previous =
      input.purchaseOrderId
        ? await this.invoiceRepository.getInvoicedQuantityByOrderItem({ entityId: input.entityId, purchaseOrderId: input.purchaseOrderId })
        : new Map<string, number>();

    validateInvoice(invoice, orderRecord?.order, previous);

    const created = await this.invoiceRepository.create(invoice);
    return toInvoiceView(created, orderRecord?.order.items);
  }
}

export namespace CreateInvoiceUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId?: string;
    customerId?: string;
    invoiceNumber: string;
    issuedAt: Date;
    dueAt: Date;
    taxAmount?: number;
    otherDeductions?: number;
    status?: Invoice.Status;
    notes?: string;
    items: InvoiceItemInput[];
  };
}
