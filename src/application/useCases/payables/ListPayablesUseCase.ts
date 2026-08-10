import { Payable } from "@application/entities/Payable";
import { PayablesResult, PayableView } from "@application/queries/types/PayableView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { Injectable } from "@kernel/decorators/Injectable";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class ListPayablesUseCase {
  constructor(
    private readonly repository: PayableRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: ListPayablesUseCase.Input): Promise<PayablesResult> {
    await this.organizationAccessService.assertUserAccess(input.entityId, input.userId);
    const rows = await this.repository.listAll(input);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    const payables: PayableView[] = rows.map((row) => ({
      id: row.payable.id,
      entityId: row.payable.entityId,
      acquisitionId: row.payable.acquisitionId,
      creditCardId: row.payable.creditCardId ?? undefined,
      description: row.payable.description,
      sellerName: row.sellerName ?? undefined,
      orderNumber: row.orderNumber,
      cardName: row.cardName ?? undefined,
      cardLastFour: row.cardLastFour ?? undefined,
      paymentMethod: row.payable.paymentMethod,
      installmentNumber: row.payable.installmentNumber,
      installmentCount: row.payable.installmentCount,
      amount: Number(row.payable.amount),
      dueAt: row.payable.dueAt,
      status: row.payable.status as Payable.Status,
      paidAt: row.payable.paidAt ?? undefined,
      overdue:
        row.payable.status === Payable.Status.OPEN &&
        row.payable.dueAt < today,
    }));

    const open = payables.filter((item) => item.status === Payable.Status.OPEN);
    const overdue = open.filter((item) => item.overdue);
    const dueNext30Days = open.filter(
      (item) => item.dueAt >= today && item.dueAt <= next30Days
    );
    const paid = payables.filter((item) => item.status === Payable.Status.PAID);

    return {
      payables,
      summary: {
        openAmount: roundMoney(open.reduce((sum, item) => sum + item.amount, 0)),
        overdueAmount: roundMoney(overdue.reduce((sum, item) => sum + item.amount, 0)),
        dueNext30DaysAmount: roundMoney(dueNext30Days.reduce((sum, item) => sum + item.amount, 0)),
        paidAmount: roundMoney(paid.reduce((sum, item) => sum + item.amount, 0)),
        openCount: open.length,
        overdueCount: overdue.length,
      },
    };
  }
}

export namespace ListPayablesUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    status?: Payable.Status;
    creditCardId?: string;
    search?: string;
    dueFrom?: Date;
    dueTo?: Date;
  };
}
