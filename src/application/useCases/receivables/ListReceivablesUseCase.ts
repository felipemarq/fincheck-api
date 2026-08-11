import { Invoice } from "@application/entities/Invoice";
import { toInvoiceView } from "@application/queries/types/InvoiceView";
import {
  ReceivableFilterStatus,
  ReceivableSort,
  ReceivablesPage,
  ReceivableView,
} from "@application/queries/types/ReceivableView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { buildInclusiveUtcDateRange } from "@application/services/buildInclusiveUtcDateRange";
import { buildReceivablesSummary } from "@application/services/buildReceivablesSummary";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { Injectable } from "@kernel/decorators/Injectable";

const DAY_IN_MS = 86_400_000;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function startOfUtcDay(value: Date) {
  return Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate()
  );
}

function getDaysOverdue(invoice: Invoice, referenceDate: Date) {
  if (invoice.receivableStatus !== Invoice.ReceivableStatus.OVERDUE) {
    return 0;
  }

  return Math.max(
    Math.floor(
      (startOfUtcDay(referenceDate) - startOfUtcDay(invoice.dueAt)) / DAY_IN_MS
    ),
    0
  );
}

function matchesStatus(
  receivable: ReceivableView,
  status: ReceivableFilterStatus
) {
  if (status === "ALL") return true;

  if (status === "PENDING") {
    return (
      receivable.status === Invoice.Status.ISSUED &&
      receivable.outstandingAmount > 0
    );
  }

  return receivable.receivableStatus === status;
}

const urgencyRank: Record<Invoice.ReceivableStatus, number> = {
  [Invoice.ReceivableStatus.OVERDUE]: 0,
  [Invoice.ReceivableStatus.PARTIALLY_RECEIVED]: 1,
  [Invoice.ReceivableStatus.OPEN]: 2,
  [Invoice.ReceivableStatus.NOT_ISSUED]: 3,
  [Invoice.ReceivableStatus.RECEIVED]: 4,
  [Invoice.ReceivableStatus.CANCELLED]: 5,
};

function sortReceivables(
  receivables: ReceivableView[],
  sort: ReceivableSort
) {
  return [...receivables].sort((a, b) => {
    if (sort === "DUE_DESC") {
      return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
    }

    if (sort === "BALANCE_DESC") {
      return b.outstandingAmount - a.outstandingAmount;
    }

    if (sort === "ISSUED_DESC") {
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    }

    if (sort === "URGENCY") {
      const rank =
        urgencyRank[a.receivableStatus] - urgencyRank[b.receivableStatus];
      if (rank !== 0) return rank;
    }

    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

@Injectable()
export class ListReceivablesUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListReceivablesUseCase.Input
  ): Promise<ReceivablesPage> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const records = await this.invoiceRepository.listAllForEntity({
      entityId: input.entityId,
    });
    const itemContexts = await this.purchaseOrderRepository.findItemContexts({
      entityId: input.entityId,
      purchaseOrderItemIds: records.flatMap(({ invoice }) =>
        invoice.items.map((item) => item.purchaseOrderItemId)
      ),
    });
    const orderItems = itemContexts.map(({ item }) => item);
    const referenceDate = new Date();
    const summary = buildReceivablesSummary(
      records.map(({ invoice }) => invoice),
      referenceDate
    );
    const dueRange = buildInclusiveUtcDateRange(input.dueFrom, input.dueTo);
    const normalizedSearch = input.search
      ? normalizeSearch(input.search)
      : undefined;

    const receivables = records.map(
      ({
        invoice,
        orderNumber,
        orderExternalNumber,
        customerId,
        customerName,
        customerDocument,
      }): ReceivableView => ({
        ...toInvoiceView(invoice, orderItems),
        orderNumber,
        orderExternalNumber,
        customerId,
        customerName,
        customerDocument,
        daysOverdue: getDaysOverdue(invoice, referenceDate),
      })
    );

    const filtered = sortReceivables(
      receivables.filter((receivable) => {
        if (!matchesStatus(receivable, input.status)) return false;
        const dueAt = new Date(receivable.dueAt);
        if (dueRange.dateFrom && dueAt < dueRange.dateFrom) return false;
        if (dueRange.dateBefore && dueAt >= dueRange.dateBefore) return false;

        if (normalizedSearch) {
          const haystack = normalizeSearch(
            [
              receivable.invoiceNumber,
              receivable.orderNumber,
              receivable.orderExternalNumber,
              receivable.customerName,
              receivable.customerDocument,
              receivable.notes,
              ...receivable.items.flatMap((item) => [
                item.description,
                item.notes,
              ]),
              ...receivable.payments.flatMap((payment) => [
                payment.reference,
                payment.paymentMethod,
              ]),
            ]
              .filter(Boolean)
              .join(" ")
          );
          if (!haystack.includes(normalizedSearch)) return false;
        }

        return true;
      }),
      input.sort
    );
    const totalPages = Math.max(Math.ceil(filtered.length / input.pageSize), 1);
    const page = Math.min(input.page, totalPages);
    const offset = (page - 1) * input.pageSize;

    return {
      receivables: filtered.slice(offset, offset + input.pageSize),
      summary,
      pagination: {
        page,
        pageSize: input.pageSize,
        total: filtered.length,
        totalPages,
      },
    };
  }
}

export namespace ListReceivablesUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    search?: string;
    status: ReceivableFilterStatus;
    dueFrom?: Date;
    dueTo?: Date;
    sort: ReceivableSort;
    page: number;
    pageSize: number;
  };
}
