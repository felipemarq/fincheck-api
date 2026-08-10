import { Acquisition } from "@application/entities/Acquisition";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from "drizzle-orm";

import { DatabaseService } from "..";
import { AcquisitionMapper } from "../items/AcquisitionItem";
import {
  acquisitionItemAllocationsTable,
  acquisitionItemsTable,
  acquisitionsTable,
  purchaseOrderItemsTable,
} from "../schema";

@Injectable()
export class AcquisitionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(acquisition: Acquisition): Promise<Acquisition> {
    const acquisitionId = acquisition.id ?? randomUUID();
    const items = acquisition.items.map((item) => ({
      item,
      id: item.id ?? randomUUID(),
    }));
    const allocationRows = items.flatMap(({ item, id }) =>
      item.allocations.map((allocation) => ({
        ...AcquisitionMapper.allocationToRow(allocation, id),
        id: allocation.id ?? randomUUID(),
      }))
    );
    const insertAcquisition = this.databaseService.db
      .insert(acquisitionsTable)
      .values({ ...AcquisitionMapper.toRow(acquisition), id: acquisitionId });
    const insertItems = this.databaseService.db
      .insert(acquisitionItemsTable)
      .values(
        items.map(({ item, id }) => ({
          ...AcquisitionMapper.itemToRow(item, acquisitionId),
          id,
        }))
      );

    if (allocationRows.length) {
      await this.databaseService.db.batch([
        insertAcquisition,
        insertItems,
        this.databaseService.db
          .insert(acquisitionItemAllocationsTable)
          .values(allocationRows),
      ]);
    } else {
      await this.databaseService.db.batch([insertAcquisition, insertItems]);
    }

    return (await this.findOne({
      entityId: acquisition.entityId,
      acquisitionId,
    }))!;
  }

  async update(
    acquisition: Acquisition,
    { replaceItems }: { replaceItems: boolean }
  ): Promise<Acquisition> {
    const { id: _id, ...values } = AcquisitionMapper.toRow(acquisition);
    const updateAcquisition = this.databaseService.db
      .update(acquisitionsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(acquisitionsTable.id, acquisition.id!),
          eq(acquisitionsTable.entityId, acquisition.entityId)
        )
      );

    if (!replaceItems) {
      await updateAcquisition;
      return (await this.findOne({
        entityId: acquisition.entityId,
        acquisitionId: acquisition.id!,
      }))!;
    }

    const items = acquisition.items.map((item) => ({
      item,
      id: item.id ?? randomUUID(),
    }));
    const allocationRows = items.flatMap(({ item, id }) =>
      item.allocations.map((allocation) => ({
        ...AcquisitionMapper.allocationToRow(allocation, id),
        id: allocation.id ?? randomUUID(),
      }))
    );
    const operations = [
      updateAcquisition,
      this.databaseService.db
        .delete(acquisitionItemsTable)
        .where(
          and(
            eq(acquisitionItemsTable.acquisitionId, acquisition.id!),
            eq(acquisitionItemsTable.entityId, acquisition.entityId)
          )
        ),
      this.databaseService.db.insert(acquisitionItemsTable).values(
        items.map(({ item, id }) => ({
          ...AcquisitionMapper.itemToRow(item, acquisition.id!),
          id,
        }))
      ),
    ] as const;

    if (allocationRows.length) {
      await this.databaseService.db.batch([
        ...operations,
        this.databaseService.db
          .insert(acquisitionItemAllocationsTable)
          .values(allocationRows),
      ]);
    } else {
      await this.databaseService.db.batch(operations);
    }

    return (await this.findOne({
      entityId: acquisition.entityId,
      acquisitionId: acquisition.id!,
    }))!;
  }

  async listAll({
    entityId,
    purchaseOrderId,
    search,
    status,
  }: {
    entityId: string;
    purchaseOrderId?: string;
    search?: string;
    status?: Acquisition.Status;
  }): Promise<Acquisition[]> {
    const conditions = [eq(acquisitionsTable.entityId, entityId)];
    if (status) conditions.push(eq(acquisitionsTable.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(acquisitionsTable.sellerName, `%${search}%`),
          ilike(acquisitionsTable.channel, `%${search}%`),
          ilike(acquisitionsTable.sellerOrderNumber, `%${search}%`)
        )!
      );
    }

    const rows = purchaseOrderId
      ? await this.databaseService.db
          .selectDistinct({ acquisition: acquisitionsTable })
          .from(acquisitionsTable)
          .innerJoin(
            acquisitionItemsTable,
            eq(acquisitionItemsTable.acquisitionId, acquisitionsTable.id)
          )
          .innerJoin(
            acquisitionItemAllocationsTable,
            eq(
              acquisitionItemAllocationsTable.acquisitionItemId,
              acquisitionItemsTable.id
            )
          )
          .innerJoin(
            purchaseOrderItemsTable,
            eq(
              purchaseOrderItemsTable.id,
              acquisitionItemAllocationsTable.purchaseOrderItemId
            )
          )
          .where(
            and(
              ...conditions,
              eq(purchaseOrderItemsTable.purchaseOrderId, purchaseOrderId)
            )
          )
          .orderBy(
            desc(acquisitionsTable.purchasedAt),
            desc(acquisitionsTable.createdAt)
          )
      : await this.databaseService.db
          .select({ acquisition: acquisitionsTable })
          .from(acquisitionsTable)
          .where(and(...conditions))
          .orderBy(
            desc(acquisitionsTable.purchasedAt),
            desc(acquisitionsTable.createdAt)
          );

    return this.hydrate(
      rows.map(({ acquisition }) => acquisition),
      entityId
    );
  }

  async findOne({
    entityId,
    acquisitionId,
    purchaseOrderId,
  }: {
    entityId: string;
    acquisitionId: string;
    purchaseOrderId?: string;
  }): Promise<Acquisition | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(acquisitionsTable)
      .where(
        and(
          eq(acquisitionsTable.id, acquisitionId),
          eq(acquisitionsTable.entityId, entityId)
        )
      )
      .limit(1);
    if (!row) return null;

    if (purchaseOrderId) {
      const [allocation] = await this.databaseService.db
        .select({ id: acquisitionItemAllocationsTable.id })
        .from(acquisitionItemAllocationsTable)
        .innerJoin(
          acquisitionItemsTable,
          eq(
            acquisitionItemsTable.id,
            acquisitionItemAllocationsTable.acquisitionItemId
          )
        )
        .innerJoin(
          purchaseOrderItemsTable,
          eq(
            purchaseOrderItemsTable.id,
            acquisitionItemAllocationsTable.purchaseOrderItemId
          )
        )
        .where(
          and(
            eq(acquisitionItemsTable.acquisitionId, acquisitionId),
            eq(purchaseOrderItemsTable.purchaseOrderId, purchaseOrderId)
          )
        )
        .limit(1);
      if (!allocation) return null;
    }

    return (await this.hydrate([row], entityId))[0] ?? null;
  }

  private async hydrate(rows: typeof acquisitionsTable.$inferSelect[], entityId: string) {
    if (!rows.length) return [];
    const acquisitionIds = rows.map((row) => row.id);
    const itemRows = await this.databaseService.db
      .select()
      .from(acquisitionItemsTable)
      .where(
        and(
          eq(acquisitionItemsTable.entityId, entityId),
          inArray(acquisitionItemsTable.acquisitionId, acquisitionIds)
        )
      )
      .orderBy(asc(acquisitionItemsTable.createdAt));
    const allocationRows = itemRows.length
      ? await this.databaseService.db
          .select()
          .from(acquisitionItemAllocationsTable)
          .where(
            and(
              eq(acquisitionItemAllocationsTable.entityId, entityId),
              inArray(
                acquisitionItemAllocationsTable.acquisitionItemId,
                itemRows.map((item) => item.id)
              )
            )
          )
          .orderBy(asc(acquisitionItemAllocationsTable.createdAt))
      : [];

    return rows.map((row) =>
      AcquisitionMapper.fromRows(
        row,
        itemRows.filter((item) => item.acquisitionId === row.id),
        allocationRows
      )
    );
  }
}
