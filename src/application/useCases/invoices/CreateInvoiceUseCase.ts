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
export class CreateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: CreateInvoiceUseCase.Input): Promise<InvoiceView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, existing] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.invoiceRepository.findByNumber(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    if (existing) {
      throw new ConflictException(
        "Ja existe uma nota fiscal com este numero."
      );
    }

    if (
      orderRecord.order.lifecycleStatus !==
      PurchaseOrder.LifecycleStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Somente ordens ativas aceitam notas fiscais."
      );
    }

    const invoice = new Invoice({
      ...input,
      createdByUserId: input.userId,
      updatedByUserId: input.userId,
      items: input.items.map(
        (item) =>
          new InvoiceItem({
            ...item,
            entityId: input.entityId,
          })
      ),
    });
    const previous =
      await this.invoiceRepository.getInvoicedQuantityByOrderItem(input);

    validateInvoice(invoice, orderRecord.order, previous);

    const created = await this.invoiceRepository.create(invoice);
    return toInvoiceView(created, orderRecord.order.items);
  }
}

export namespace CreateInvoiceUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
    invoiceNumber: string;
    issuedAt: Date;
    dueAt: Date;
    taxAmount?: number;
    otherDeductions?: number;
    status?: Invoice.Status;
    notes?: string;
    items: Array<{
      purchaseOrderItemId: string;
      invoicedQuantity: number;
      unitPrice: number;
      notes?: string;
    }>;
  };
}
