import { AcquisitionReceipt } from "@application/entities/AcquisitionReceipt";
import { acquisitionReceiptItemKey } from "@application/services/validateOperations";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import { DatabaseService } from "..";
import { AcquisitionReceiptMapper } from "../items/AcquisitionReceiptItem";
import {
  acquisitionItemAllocationsTable,
  acquisitionItemsTable,
  acquisitionReceiptItemsTable,
  acquisitionReceiptsTable,
  acquisitionsTable,
} from "../schema";

@Injectable()
export class AcquisitionReceiptRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(receipt: AcquisitionReceipt): Promise<AcquisitionReceipt> {
    const receiptId = receipt.id ?? randomUUID();

    await this.databaseService.db.batch([
      this.databaseService.db.insert(acquisitionReceiptsTable).values({
        ...AcquisitionReceiptMapper.toRow(receipt),
        id: receiptId,
      }),
      this.databaseService.db.insert(acquisitionReceiptItemsTable).values(
        receipt.items.map((item) =>
          AcquisitionReceiptMapper.itemToRow(item, receiptId)
        )
      ),
    ]);

    await this.syncAcquisitionStatus({
      entityId: receipt.entityId,
      acquisitionId: receipt.acquisitionId,
    });

    return (await this.findOne({
      entityId: receipt.entityId,
      purchaseOrderId: receipt.purchaseOrderId,
      acquisitionId: receipt.acquisitionId,
      receiptId,
    }))!;
  }

  async update(receipt: AcquisitionReceipt): Promise<AcquisitionReceipt> {
    const { id: _id, ...values } =
      AcquisitionReceiptMapper.toRow(receipt);

    await this.databaseService.db.batch([
      this.databaseService.db
        .update(acquisitionReceiptsTable)
        .set({ ...values, updatedAt: new Date() })
        .where(
          and(
            eq(acquisitionReceiptsTable.id, receipt.id!),
            eq(acquisitionReceiptsTable.entityId, receipt.entityId),
            eq(
              acquisitionReceiptsTable.acquisitionId,
              receipt.acquisitionId
            )
          )
        ),
      this.databaseService.db
        .delete(acquisitionReceiptItemsTable)
        .where(
          and(
            eq(acquisitionReceiptItemsTable.receiptId, receipt.id!),
            eq(acquisitionReceiptItemsTable.entityId, receipt.entityId)
          )
        ),
      this.databaseService.db.insert(acquisitionReceiptItemsTable).values(
        receipt.items.map((item) =>
          AcquisitionReceiptMapper.itemToRow(item, receipt.id!)
        )
      ),
    ]);

    await this.syncAcquisitionStatus({
      entityId: receipt.entityId,
      acquisitionId: receipt.acquisitionId,
    });

    return (await this.findOne({
      entityId: receipt.entityId,
      purchaseOrderId: receipt.purchaseOrderId,
      acquisitionId: receipt.acquisitionId,
      receiptId: receipt.id!,
    }))!;
  }

  async listAll({
    entityId,
    purchaseOrderId,
    acquisitionId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    acquisitionId: string;
  }): Promise<AcquisitionReceipt[]> {
    const rows = await this.databaseService.db
      .select()
      .from(acquisitionReceiptsTable)
      .where(
        and(
          eq(acquisitionReceiptsTable.entityId, entityId),
          eq(acquisitionReceiptsTable.purchaseOrderId, purchaseOrderId),
          eq(acquisitionReceiptsTable.acquisitionId, acquisitionId)
        )
      )
      .orderBy(
        desc(acquisitionReceiptsTable.receivedAt),
        desc(acquisitionReceiptsTable.createdAt)
      );

    if (!rows.length) {
      return [];
    }

    const receiptIds = rows.map((row) => row.id);
    const itemRows = await this.databaseService.db
      .select()
      .from(acquisitionReceiptItemsTable)
      .where(
        and(
          eq(acquisitionReceiptItemsTable.entityId, entityId),
          inArray(acquisitionReceiptItemsTable.receiptId, receiptIds)
        )
      )
      .orderBy(asc(acquisitionReceiptItemsTable.createdAt));

    return rows.map((row) =>
      AcquisitionReceiptMapper.fromRows(
        row,
        itemRows.filter((item) => item.receiptId === row.id)
      )
    );
  }

  async findOne({
    entityId,
    purchaseOrderId,
    acquisitionId,
    receiptId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    acquisitionId: string;
    receiptId: string;
  }): Promise<AcquisitionReceipt | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(acquisitionReceiptsTable)
      .where(
        and(
          eq(acquisitionReceiptsTable.id, receiptId),
          eq(acquisitionReceiptsTable.entityId, entityId),
          eq(acquisitionReceiptsTable.purchaseOrderId, purchaseOrderId),
          eq(acquisitionReceiptsTable.acquisitionId, acquisitionId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const itemRows = await this.databaseService.db
      .select()
      .from(acquisitionReceiptItemsTable)
      .where(
        and(
          eq(acquisitionReceiptItemsTable.entityId, entityId),
          eq(acquisitionReceiptItemsTable.receiptId, receiptId)
        )
      )
      .orderBy(asc(acquisitionReceiptItemsTable.createdAt));

    return AcquisitionReceiptMapper.fromRows(row, itemRows);
  }

  async getReceivedQuantityByAcquisitionItem({
    entityId,
    acquisitionId,
    exceptReceiptId,
  }: {
    entityId: string;
    acquisitionId: string;
    exceptReceiptId?: string;
  }): Promise<Map<string, number>> {
    const conditions = [
      eq(acquisitionReceiptsTable.entityId, entityId),
      eq(acquisitionReceiptsTable.acquisitionId, acquisitionId),
      eq(acquisitionReceiptsTable.status, "CONFIRMED"),
    ];

    if (exceptReceiptId) {
      conditions.push(ne(acquisitionReceiptsTable.id, exceptReceiptId));
    }

    const rows = await this.databaseService.db
      .select({ item: acquisitionReceiptItemsTable })
      .from(acquisitionReceiptItemsTable)
      .innerJoin(
        acquisitionReceiptsTable,
        and(
          eq(
            acquisitionReceiptsTable.id,
            acquisitionReceiptItemsTable.receiptId
          ),
          eq(
            acquisitionReceiptsTable.entityId,
            acquisitionReceiptItemsTable.entityId
          )
        )
      )
      .where(and(...conditions));

    const totals = new Map<string, number>();

    rows.forEach(({ item }) => {
      const key = acquisitionReceiptItemKey(
        item.acquisitionItemId,
        item.purchaseOrderItemId
      );
      totals.set(
        key,
        (totals.get(key) ?? 0) + Number(item.receivedQuantity)
      );
    });

    return totals;
  }

  async hasConfirmedReceipts({
    entityId,
    acquisitionId,
  }: {
    entityId: string;
    acquisitionId: string;
  }): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: acquisitionReceiptsTable.id })
      .from(acquisitionReceiptsTable)
      .where(
        and(
          eq(acquisitionReceiptsTable.entityId, entityId),
          eq(acquisitionReceiptsTable.acquisitionId, acquisitionId),
          eq(acquisitionReceiptsTable.status, "CONFIRMED")
        )
      )
      .limit(1);

    return Boolean(row);
  }

  private async syncAcquisitionStatus({
    entityId,
    acquisitionId,
  }: {
    entityId: string;
    acquisitionId: string;
  }): Promise<void> {
    const allocationRows = await this.databaseService.db
      .select({ allocation: acquisitionItemAllocationsTable })
      .from(acquisitionItemAllocationsTable)
      .innerJoin(
        acquisitionItemsTable,
        eq(
          acquisitionItemsTable.id,
          acquisitionItemAllocationsTable.acquisitionItemId
        )
      )
      .where(
        and(
          eq(acquisitionItemsTable.entityId, entityId),
          eq(acquisitionItemsTable.acquisitionId, acquisitionId)
        )
      );

    const receivedByItem =
      await this.getReceivedQuantityByAcquisitionItem({
        entityId,
        acquisitionId,
      });

    const totalAcquired = allocationRows.reduce(
      (total, { allocation }) =>
        total + Number(allocation.allocatedQuantity),
      0
    );
    const totalReceived = [...receivedByItem.values()].reduce(
      (total, quantity) => total + quantity,
      0
    );
    const status =
      totalReceived <= 0
        ? "IN_TRANSIT"
        : totalReceived + 0.0005 >= totalAcquired
          ? "RECEIVED"
          : "PARTIALLY_RECEIVED";

    await this.databaseService.db
      .update(acquisitionsTable)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(acquisitionsTable.id, acquisitionId),
          eq(acquisitionsTable.entityId, entityId),
          ne(acquisitionsTable.status, "CANCELLED")
        )
      );
  }
}
