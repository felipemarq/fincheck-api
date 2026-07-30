import { Customer } from "@application/entities/Customer";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
} from "drizzle-orm";

import { DatabaseService } from "..";
import { CustomerItem } from "../items/CustomerItem";
import { PurchaseOrderMapper } from "../items/PurchaseOrderItem";
import {
  customersTable,
  purchaseOrderItemsTable,
  purchaseOrdersTable,
} from "../schema";

export type PurchaseOrderWithCustomer = {
  order: PurchaseOrder;
  customer: Customer;
};

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(order: PurchaseOrder): Promise<PurchaseOrderWithCustomer> {
    const createdOrderId = await this.databaseService.db.transaction(
      async (transaction) => {
        const [createdOrder] = await transaction
          .insert(purchaseOrdersTable)
          .values(PurchaseOrderMapper.toRow(order))
          .returning({ id: purchaseOrdersTable.id });

        if (order.items.length) {
          await transaction
            .insert(purchaseOrderItemsTable)
            .values(
              order.items.map((item) =>
                PurchaseOrderMapper.itemToRow(item, createdOrder.id)
              )
            );
        }

        return createdOrder.id;
      }
    );

    return (await this.findOne({
      entityId: order.entityId,
      purchaseOrderId: createdOrderId,
    }))!;
  }

  async update(
    order: PurchaseOrder,
    options: { replaceItems: boolean }
  ): Promise<PurchaseOrderWithCustomer> {
    await this.databaseService.db.transaction(async (transaction) => {
      const { id: _id, ...values } = PurchaseOrderMapper.toRow(order);

      await transaction
        .update(purchaseOrdersTable)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(purchaseOrdersTable.id, order.id!),
            eq(purchaseOrdersTable.entityId, order.entityId)
          )
        );

      if (options.replaceItems) {
        await transaction
          .delete(purchaseOrderItemsTable)
          .where(
            and(
              eq(purchaseOrderItemsTable.purchaseOrderId, order.id!),
              eq(purchaseOrderItemsTable.entityId, order.entityId)
            )
          );

        if (order.items.length) {
          await transaction
            .insert(purchaseOrderItemsTable)
            .values(
              order.items.map((item) =>
                PurchaseOrderMapper.itemToRow(item, order.id!)
              )
            );
        }
      }
    });

    return (await this.findOne({
      entityId: order.entityId,
      purchaseOrderId: order.id!,
    }))!;
  }

  async listAll({
    entityId,
    customerId,
    lifecycleStatus,
    search,
  }: {
    entityId: string;
    customerId?: string;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    search?: string;
  }): Promise<PurchaseOrderWithCustomer[]> {
    const conditions = [eq(purchaseOrdersTable.entityId, entityId)];

    if (customerId) {
      conditions.push(eq(purchaseOrdersTable.customerId, customerId));
    }

    if (lifecycleStatus) {
      conditions.push(
        eq(purchaseOrdersTable.lifecycleStatus, lifecycleStatus)
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(purchaseOrdersTable.orderNumber, `%${search}%`),
          ilike(purchaseOrdersTable.externalNumber, `%${search}%`),
          ilike(customersTable.legalName, `%${search}%`),
          ilike(customersTable.tradeName, `%${search}%`)
        )!
      );
    }

    const rows = await this.databaseService.db
      .select({
        order: purchaseOrdersTable,
        customer: customersTable,
      })
      .from(purchaseOrdersTable)
      .innerJoin(
        customersTable,
        and(
          eq(customersTable.id, purchaseOrdersTable.customerId),
          eq(customersTable.entityId, purchaseOrdersTable.entityId)
        )
      )
      .where(and(...conditions))
      .orderBy(
        desc(purchaseOrdersTable.issuedAt),
        desc(purchaseOrdersTable.createdAt)
      );

    if (!rows.length) {
      return [];
    }

    const orderIds = rows.map(({ order }) => order.id);
    const itemRows = await this.databaseService.db
      .select()
      .from(purchaseOrderItemsTable)
      .where(
        and(
          eq(purchaseOrderItemsTable.entityId, entityId),
          inArray(purchaseOrderItemsTable.purchaseOrderId, orderIds)
        )
      )
      .orderBy(asc(purchaseOrderItemsTable.lineNumber));

    return rows.map(({ order, customer }) => ({
      order: PurchaseOrderMapper.fromRows(
        order,
        itemRows.filter((item) => item.purchaseOrderId === order.id)
      ),
      customer: CustomerItem.fromRow(customer),
    }));
  }

  async findOne({
    entityId,
    purchaseOrderId,
  }: {
    entityId: string;
    purchaseOrderId: string;
  }): Promise<PurchaseOrderWithCustomer | null> {
    const [row] = await this.databaseService.db
      .select({
        order: purchaseOrdersTable,
        customer: customersTable,
      })
      .from(purchaseOrdersTable)
      .innerJoin(
        customersTable,
        and(
          eq(customersTable.id, purchaseOrdersTable.customerId),
          eq(customersTable.entityId, purchaseOrdersTable.entityId)
        )
      )
      .where(
        and(
          eq(purchaseOrdersTable.id, purchaseOrderId),
          eq(purchaseOrdersTable.entityId, entityId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const itemRows = await this.databaseService.db
      .select()
      .from(purchaseOrderItemsTable)
      .where(
        and(
          eq(purchaseOrderItemsTable.purchaseOrderId, purchaseOrderId),
          eq(purchaseOrderItemsTable.entityId, entityId)
        )
      )
      .orderBy(asc(purchaseOrderItemsTable.lineNumber));

    return {
      order: PurchaseOrderMapper.fromRows(row.order, itemRows),
      customer: CustomerItem.fromRow(row.customer),
    };
  }

  async findByOrderNumber({
    entityId,
    customerId,
    orderNumber,
    exceptPurchaseOrderId,
  }: {
    entityId: string;
    customerId: string;
    orderNumber: string;
    exceptPurchaseOrderId?: string;
  }): Promise<PurchaseOrder | null> {
    const conditions = [
      eq(purchaseOrdersTable.entityId, entityId),
      eq(purchaseOrdersTable.customerId, customerId),
      eq(purchaseOrdersTable.orderNumber, orderNumber),
    ];

    if (exceptPurchaseOrderId) {
      conditions.push(ne(purchaseOrdersTable.id, exceptPurchaseOrderId));
    }

    const [row] = await this.databaseService.db
      .select()
      .from(purchaseOrdersTable)
      .where(and(...conditions))
      .limit(1);

    return row ? PurchaseOrderMapper.fromRows(row, []) : null;
  }
}
