import { NotFoundException } from "@application/errors/http/NotFoundException";
import {
  InvoiceView,
  toInvoiceView,
} from "@application/queries/types/InvoiceView";
import { FinancialAccessService } from "@application/services/FinancialAccessService";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListInvoicesUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly financialAccessService: FinancialAccessService
  ) {}

  async execute(input: ListInvoicesUseCase.Input): Promise<InvoiceView[]> {
    await this.financialAccessService.assertUserAccess(
      input.entityId,
      input.userId,
      "invoices.read"
    );

    const [orderRecord, invoices] = await Promise.all([
      input.purchaseOrderId
        ? this.purchaseOrderRepository.findOne({ entityId: input.entityId, purchaseOrderId: input.purchaseOrderId })
        : Promise.resolve(null),
      this.invoiceRepository.listAll(input),
    ]);

    if (input.purchaseOrderId && !orderRecord) {
      throw new NotFoundException("Ordem de compra nao encontrada.");
    }

    const fallbackItems = orderRecord?.order.items ?? (await this.purchaseOrderRepository.findItemContexts({
      entityId: input.entityId,
      purchaseOrderItemIds: invoices.flatMap(invoice => invoice.items.flatMap(item =>
        !item.description && item.purchaseOrderItemId ? [item.purchaseOrderItemId] : []
      )),
    })).map(({ item }) => item);
    return invoices.map((invoice) =>
      toInvoiceView(invoice, fallbackItems)
    );
  }
}

export namespace ListInvoicesUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    purchaseOrderId?: string;
  };
}
