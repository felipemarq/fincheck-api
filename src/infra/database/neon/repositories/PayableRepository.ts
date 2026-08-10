import { Payable } from "@application/entities/Payable";
import { Injectable } from "@kernel/decorators/Injectable";
import { Acquisition } from "@application/entities/Acquisition";
import { and, asc, desc, eq, gte, ilike, lt, lte, or } from "drizzle-orm";
import { DatabaseService } from "..";
import { PayableItem } from "../items/PayableItem";
import {
  acquisitionsTable,
  creditCardsTable,
  payablesTable,
  purchaseOrdersTable,
} from "../schema";

@Injectable()
export class PayableRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async replaceForAcquisition({
    acquisitionId,
    entityId,
    payables,
  }: {
    acquisitionId: string;
    entityId: string;
    payables: Payable[];
  }): Promise<void> {
    await this.databaseService.db.batch([
      this.databaseService.db
        .delete(payablesTable)
        .where(
          and(
            eq(payablesTable.acquisitionId, acquisitionId),
            eq(payablesTable.entityId, entityId)
          )
        ),
      this.databaseService.db
        .insert(payablesTable)
        .values(payables.map(PayableItem.toRow)),
    ]);
  }

  async updateDescriptionForAcquisition({
    acquisitionId,
    entityId,
    description,
    updatedByUserId,
  }: {
    acquisitionId: string;
    entityId: string;
    description: string;
    updatedByUserId: string;
  }): Promise<void> {
    await this.databaseService.db
      .update(payablesTable)
      .set({ description, updatedByUserId, updatedAt: new Date() })
      .where(
        and(
          eq(payablesTable.acquisitionId, acquisitionId),
          eq(payablesTable.entityId, entityId)
        )
      );
  }

  async hasPaidForAcquisition({
    acquisitionId,
    entityId,
  }: {
    acquisitionId: string;
    entityId: string;
  }): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: payablesTable.id })
      .from(payablesTable)
      .where(
        and(
          eq(payablesTable.acquisitionId, acquisitionId),
          eq(payablesTable.entityId, entityId),
          eq(payablesTable.status, Payable.Status.PAID)
        )
      )
      .limit(1);
    return Boolean(row);
  }

  async listAll({
    entityId,
    status,
    creditCardId,
    search,
    dueFrom,
    dueTo,
  }: {
    entityId: string;
    status?: Payable.Status;
    creditCardId?: string;
    search?: string;
    dueFrom?: Date;
    dueTo?: Date;
  }) {
    const conditions = [eq(payablesTable.entityId, entityId)];
    if (status) conditions.push(eq(payablesTable.status, status));
    if (creditCardId) conditions.push(eq(payablesTable.creditCardId, creditCardId));
    if (dueFrom) conditions.push(gte(payablesTable.dueAt, dueFrom));
    if (dueTo) conditions.push(lte(payablesTable.dueAt, dueTo));
    if (search) {
      conditions.push(
        or(
          ilike(payablesTable.description, `%${search}%`),
          ilike(acquisitionsTable.sellerName, `%${search}%`),
          ilike(purchaseOrdersTable.orderNumber, `%${search}%`)
        )!
      );
    }

    return this.databaseService.db
      .select({
        payable: payablesTable,
        sellerName: acquisitionsTable.sellerName,
        orderNumber: purchaseOrdersTable.orderNumber,
        cardName: creditCardsTable.name,
        cardLastFour: creditCardsTable.lastFour,
      })
      .from(payablesTable)
      .innerJoin(acquisitionsTable, eq(acquisitionsTable.id, payablesTable.acquisitionId))
      .innerJoin(purchaseOrdersTable, eq(purchaseOrdersTable.id, acquisitionsTable.purchaseOrderId))
      .leftJoin(creditCardsTable, eq(creditCardsTable.id, payablesTable.creditCardId))
      .where(and(...conditions))
      .orderBy(asc(payablesTable.dueAt), desc(payablesTable.createdAt));
  }

  async findOne({ entityId, payableId }: { entityId: string; payableId: string }) {
    const [row] = await this.databaseService.db
      .select()
      .from(payablesTable)
      .where(and(eq(payablesTable.id, payableId), eq(payablesTable.entityId, entityId)))
      .limit(1);
    return row ? PayableItem.fromRow(row) : null;
  }

  async updateStatus(payable: Payable): Promise<Payable> {
    const [row] = await this.databaseService.db
      .update(payablesTable)
      .set({
        status: payable.status,
        paidAt: payable.paidAt ?? null,
        updatedByUserId: payable.updatedByUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(payablesTable.id, payable.id!), eq(payablesTable.entityId, payable.entityId)))
      .returning();
    return PayableItem.fromRow(row);
  }

  async settleCreditCardStatement({
    entityId,
    creditCardId,
    dueFrom,
    dueTo,
    paidAt,
    updatedByUserId,
  }: {
    entityId: string;
    creditCardId: string;
    dueFrom: Date;
    dueTo: Date;
    paidAt: Date;
    updatedByUserId: string;
  }): Promise<{ settledCount: number; settledAmount: number }> {
    const rows = await this.databaseService.db
      .update(payablesTable)
      .set({
        status: Payable.Status.PAID,
        paidAt,
        updatedByUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payablesTable.entityId, entityId),
          eq(payablesTable.creditCardId, creditCardId),
          eq(
            payablesTable.paymentMethod,
            Acquisition.PaymentMethod.CREDIT_CARD
          ),
          eq(payablesTable.status, Payable.Status.OPEN),
          gte(payablesTable.dueAt, dueFrom),
          lt(payablesTable.dueAt, dueTo)
        )
      )
      .returning({ amount: payablesTable.amount });

    return {
      settledCount: rows.length,
      settledAmount:
        Math.round(
          (rows.reduce((sum, row) => sum + Number(row.amount), 0) +
            Number.EPSILON) *
            100
        ) / 100,
    };
  }
}
