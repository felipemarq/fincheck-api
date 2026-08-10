import { Payable } from "@application/entities/Payable";
import type { NewPayableRow, PayableRow } from "../schema";

export class PayableItem {
  static fromRow(row: PayableRow): Payable {
    return new Payable({
      id: row.id,
      entityId: row.entityId,
      acquisitionId: row.acquisitionId,
      creditCardId: row.creditCardId ?? undefined,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      description: row.description,
      paymentMethod: row.paymentMethod,
      installmentNumber: row.installmentNumber,
      installmentCount: row.installmentCount,
      amount: Number(row.amount),
      dueAt: row.dueAt,
      status: row.status as Payable.Status,
      paidAt: row.paidAt ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(payable: Payable): NewPayableRow {
    return {
      id: payable.id,
      entityId: payable.entityId,
      acquisitionId: payable.acquisitionId,
      creditCardId: payable.creditCardId ?? null,
      createdByUserId: payable.createdByUserId,
      updatedByUserId: payable.updatedByUserId,
      description: payable.description,
      paymentMethod: payable.paymentMethod,
      installmentNumber: payable.installmentNumber,
      installmentCount: payable.installmentCount,
      amount: payable.amount.toFixed(2),
      dueAt: payable.dueAt,
      status: payable.status,
      paidAt: payable.paidAt ?? null,
      notes: payable.notes ?? null,
    };
  }
}
