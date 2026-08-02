import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  InvoiceView,
  toInvoiceView,
} from "@application/queries/types/InvoiceView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListInvoicesUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: ListInvoicesUseCase.Input): Promise<InvoiceView[]> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const [orderRecord, invoices] = await Promise.all([
      this.purchaseOrderRepository.findOne(input),
      this.invoiceRepository.listAll(input),
    ]);

    if (!orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    return invoices.map((invoice) =>
      toInvoiceView(invoice, orderRecord.order.items)
    );
  }
}

export namespace ListInvoicesUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId: string;
  };
}
