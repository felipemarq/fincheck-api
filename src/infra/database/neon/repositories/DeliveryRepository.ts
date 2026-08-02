import { Delivery } from "@application/entities/Delivery";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import { DatabaseService } from "..";
import { DeliveryMapper } from "../items/DeliveryItem";
import { deliveriesTable, deliveryItemsTable } from "../schema";

@Injectable()
export class DeliveryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(delivery: Delivery): Promise<Delivery> {
    const deliveryId = delivery.id ?? randomUUID();

    await this.databaseService.db.batch([
      this.databaseService.db.insert(deliveriesTable).values({
        ...DeliveryMapper.toRow(delivery),
        id: deliveryId,
      }),
      this.databaseService.db.insert(deliveryItemsTable).values(
        delivery.items.map((item) =>
          DeliveryMapper.itemToRow(item, deliveryId)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: delivery.entityId,
      purchaseOrderId: delivery.purchaseOrderId,
      deliveryId,
    }))!;
  }

  async update(delivery: Delivery): Promise<Delivery> {
    const { id: _id, ...values } = DeliveryMapper.toRow(delivery);

    await this.databaseService.db.batch([
      this.databaseService.db
        .update(deliveriesTable)
        .set({ ...values, updatedAt: new Date() })
        .where(
          and(
            eq(deliveriesTable.id, delivery.id!),
            eq(deliveriesTable.entityId, delivery.entityId),
            eq(deliveriesTable.purchaseOrderId, delivery.purchaseOrderId)
          )
        ),
      this.databaseService.db
        .delete(deliveryItemsTable)
        .where(
          and(
            eq(deliveryItemsTable.deliveryId, delivery.id!),
            eq(deliveryItemsTable.entityId, delivery.entityId)
          )
        ),
      this.databaseService.db.insert(deliveryItemsTable).values(
        delivery.items.map((item) =>
          DeliveryMapper.itemToRow(item, delivery.id!)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: delivery.entityId,
      purchaseOrderId: delivery.purchaseOrderId,
      deliveryId: delivery.id!,
    }))!;
  }

  async listAll({
    entityId,
    purchaseOrderId,
  }: {
    entityId: string;
    purchaseOrderId: string;
  }): Promise<Delivery[]> {
    const rows = await this.databaseService.db
      .select()
      .from(deliveriesTable)
      .where(
        and(
          eq(deliveriesTable.entityId, entityId),
          eq(deliveriesTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .orderBy(
        desc(deliveriesTable.createdAt),
        desc(deliveriesTable.deliveredAt)
      );

    if (!rows.length) {
      return [];
    }

    const deliveryIds = rows.map((row) => row.id);
    const itemRows = await this.databaseService.db
      .select()
      .from(deliveryItemsTable)
      .where(
        and(
          eq(deliveryItemsTable.entityId, entityId),
          inArray(deliveryItemsTable.deliveryId, deliveryIds)
        )
      )
      .orderBy(asc(deliveryItemsTable.createdAt));

    return rows.map((row) =>
      DeliveryMapper.fromRows(
        row,
        itemRows.filter((item) => item.deliveryId === row.id)
      )
    );
  }

  async findOne({
    entityId,
    purchaseOrderId,
    deliveryId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    deliveryId: string;
  }): Promise<Delivery | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(deliveriesTable)
      .where(
        and(
          eq(deliveriesTable.id, deliveryId),
          eq(deliveriesTable.entityId, entityId),
          eq(deliveriesTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const itemRows = await this.databaseService.db
      .select()
      .from(deliveryItemsTable)
      .where(
        and(
          eq(deliveryItemsTable.entityId, entityId),
          eq(deliveryItemsTable.deliveryId, deliveryId)
        )
      )
      .orderBy(asc(deliveryItemsTable.createdAt));

    return DeliveryMapper.fromRows(row, itemRows);
  }

  async getQuantityByOrderItem({
    entityId,
    purchaseOrderId,
    exceptDeliveryId,
    deliveredOnly = false,
  }: {
    entityId: string;
    purchaseOrderId: string;
    exceptDeliveryId?: string;
    deliveredOnly?: boolean;
  }): Promise<Map<string, number>> {
    const conditions = [
      eq(deliveriesTable.entityId, entityId),
      eq(deliveriesTable.purchaseOrderId, purchaseOrderId),
      ne(deliveriesTable.status, "CANCELLED"),
    ];

    if (exceptDeliveryId) {
      conditions.push(ne(deliveriesTable.id, exceptDeliveryId));
    }

    if (deliveredOnly) {
      conditions.push(eq(deliveriesTable.status, "DELIVERED"));
    }

    const rows = await this.databaseService.db
      .select({ item: deliveryItemsTable })
      .from(deliveryItemsTable)
      .innerJoin(
        deliveriesTable,
        and(
          eq(deliveriesTable.id, deliveryItemsTable.deliveryId),
          eq(deliveriesTable.entityId, deliveryItemsTable.entityId)
        )
      )
      .where(and(...conditions));

    const totals = new Map<string, number>();

    rows.forEach(({ item }) => {
      totals.set(
        item.purchaseOrderItemId,
        (totals.get(item.purchaseOrderItemId) ?? 0) +
          Number(item.deliveredQuantity)
      );
    });

    return totals;
  }
}
