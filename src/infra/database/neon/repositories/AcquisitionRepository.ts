import { Acquisition } from "@application/entities/Acquisition";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { DatabaseService } from "..";
import { AcquisitionMapper } from "../items/AcquisitionItem";
import { acquisitionItemsTable, acquisitionsTable } from "../schema";

@Injectable()
export class AcquisitionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(acquisition: Acquisition): Promise<Acquisition> {
    const acquisitionId = acquisition.id ?? randomUUID();

    await this.databaseService.db.batch([
      this.databaseService.db.insert(acquisitionsTable).values({
        ...AcquisitionMapper.toRow(acquisition),
        id: acquisitionId,
      }),
      this.databaseService.db.insert(acquisitionItemsTable).values(
        acquisition.items.map((item) =>
          AcquisitionMapper.itemToRow(item, acquisitionId)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: acquisition.entityId,
      purchaseOrderId: acquisition.purchaseOrderId,
      acquisitionId,
    }))!;
  }

  async update(acquisition: Acquisition): Promise<Acquisition> {
    const { id: _id, ...values } = AcquisitionMapper.toRow(acquisition);

    await this.databaseService.db.batch([
      this.databaseService.db
        .update(acquisitionsTable)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(acquisitionsTable.id, acquisition.id!),
            eq(acquisitionsTable.entityId, acquisition.entityId),
            eq(
              acquisitionsTable.purchaseOrderId,
              acquisition.purchaseOrderId
            )
          )
        ),
      this.databaseService.db
        .delete(acquisitionItemsTable)
        .where(
          and(
            eq(acquisitionItemsTable.acquisitionId, acquisition.id!),
            eq(acquisitionItemsTable.entityId, acquisition.entityId)
          )
        ),
      this.databaseService.db.insert(acquisitionItemsTable).values(
        acquisition.items.map((item) =>
          AcquisitionMapper.itemToRow(item, acquisition.id!)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: acquisition.entityId,
      purchaseOrderId: acquisition.purchaseOrderId,
      acquisitionId: acquisition.id!,
    }))!;
  }

  async listAll({
    entityId,
    purchaseOrderId,
  }: {
    entityId: string;
    purchaseOrderId: string;
  }): Promise<Acquisition[]> {
    const rows = await this.databaseService.db
      .select()
      .from(acquisitionsTable)
      .where(
        and(
          eq(acquisitionsTable.entityId, entityId),
          eq(acquisitionsTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .orderBy(
        desc(acquisitionsTable.purchasedAt),
        desc(acquisitionsTable.createdAt)
      );

    if (!rows.length) {
      return [];
    }

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

    return rows.map((row) =>
      AcquisitionMapper.fromRows(
        row,
        itemRows.filter((item) => item.acquisitionId === row.id)
      )
    );
  }

  async findOne({
    entityId,
    purchaseOrderId,
    acquisitionId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    acquisitionId: string;
  }): Promise<Acquisition | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(acquisitionsTable)
      .where(
        and(
          eq(acquisitionsTable.id, acquisitionId),
          eq(acquisitionsTable.entityId, entityId),
          eq(acquisitionsTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const itemRows = await this.databaseService.db
      .select()
      .from(acquisitionItemsTable)
      .where(
        and(
          eq(acquisitionItemsTable.acquisitionId, acquisitionId),
          eq(acquisitionItemsTable.entityId, entityId)
        )
      )
      .orderBy(asc(acquisitionItemsTable.createdAt));

    return AcquisitionMapper.fromRows(row, itemRows);
  }
}
