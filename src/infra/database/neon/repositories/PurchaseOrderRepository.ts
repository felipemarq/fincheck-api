import { Customer } from "@application/entities/Customer";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "@application/entities/PurchaseOrder";
import {
  PurchaseOrderItemQueuePage,
  PurchaseOrderItemProcurementStatus,
} from "@application/queries/types/PurchaseOrderItemQueueView";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import {
  SQL,
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { DatabaseService } from "..";
import { CustomerItem } from "../items/CustomerItem";
import { PurchaseOrderMapper } from "../items/PurchaseOrderItem";
import { AcquisitionMapper } from "../items/AcquisitionItem";
import { calculateAcquisitionAllocationCosts } from "@application/services/calculateAcquisitionAllocationCosts";
import {
  acquisitionItemAllocationsTable,
  acquisitionItemsTable,
  acquisitionReceiptItemsTable,
  acquisitionReceiptsTable,
  acquisitionsTable,
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  invoiceItemsTable,
  invoicesTable,
  productsTable,
  purchaseOrderItemsTable,
  purchaseOrdersTable,
  receivablePaymentsTable,
} from "../schema";

export type PurchaseOrderWithCustomer = {
  order: PurchaseOrder;
  customer: Customer;
};

export type PurchaseOrderItemContext = {
  item: PurchaseOrderItem;
  purchaseOrderId: string;
  orderNumber: string;
  customerName: string;
  lifecycleStatus: PurchaseOrder.LifecycleStatus;
};

type PurchaseOrderOperationalData = {
  acquiredQuantityByItemId: Map<string, number>;
  receivedQuantityByItemId: Map<string, number>;
  committedDeliveryQuantityByItemId: Map<string, number>;
  deliveredQuantityByItemId: Map<string, number>;
  invoicedQuantityByItemId: Map<string, number>;
  acquisitionCount: number;
  knownAcquisitionCost: number;
  deliveryCount: number;
  deliveryCost: number;
  invoiceCount: number;
  invoicedRevenue: number;
  taxCost: number;
  otherDeductions: number;
  receivedRevenue: number;
  receivableBalance: number;
};

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(order: PurchaseOrder): Promise<PurchaseOrderWithCustomer> {
    const createdOrderId = order.id ?? randomUUID();

    await this.databaseService.db.batch([
      this.databaseService.db
        .insert(purchaseOrdersTable)
        .values({
          ...PurchaseOrderMapper.toRow(order),
          id: createdOrderId,
        }),
      this.databaseService.db.insert(purchaseOrderItemsTable).values(
        order.items.map((item) =>
          PurchaseOrderMapper.itemToRow(item, createdOrderId)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: order.entityId,
      purchaseOrderId: createdOrderId,
    }))!;
  }

  async update(
    order: PurchaseOrder,
    options: { replaceItems: boolean }
  ): Promise<PurchaseOrderWithCustomer> {
    const { id: _id, ...values } = PurchaseOrderMapper.toRow(order);
    const updateOrder = this.databaseService.db
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
      await this.databaseService.db.batch([
        updateOrder,
        this.databaseService.db
          .delete(purchaseOrderItemsTable)
          .where(
            and(
              eq(purchaseOrderItemsTable.purchaseOrderId, order.id!),
              eq(purchaseOrderItemsTable.entityId, order.entityId)
            )
          ),
        this.databaseService.db.insert(purchaseOrderItemsTable).values(
          order.items.map((item) =>
            PurchaseOrderMapper.itemToRow(item, order.id!)
          )
        ),
      ]);
    } else {
      await updateOrder;
    }

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
    issuedFrom,
    issuedBefore,
  }: {
    entityId: string;
    customerId?: string;
    lifecycleStatus?: PurchaseOrder.LifecycleStatus;
    search?: string;
    issuedFrom?: Date;
    issuedBefore?: Date;
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

    if (issuedFrom) {
      conditions.push(gte(purchaseOrdersTable.issuedAt, issuedFrom));
    }

    if (issuedBefore) {
      conditions.push(lt(purchaseOrdersTable.issuedAt, issuedBefore));
    }

    if (search) {
      const pattern = `%${search}%`;
      const matchingOrderItems = this.databaseService.db
        .select({ purchaseOrderId: purchaseOrderItemsTable.purchaseOrderId })
        .from(purchaseOrderItemsTable)
        .innerJoin(
          productsTable,
          and(
            eq(productsTable.id, purchaseOrderItemsTable.productId),
            eq(productsTable.entityId, entityId)
          )
        )
        .where(
          and(
            eq(purchaseOrderItemsTable.entityId, entityId),
            or(
              ilike(purchaseOrderItemsTable.description, pattern),
              ilike(purchaseOrderItemsTable.brand, pattern),
              ilike(purchaseOrderItemsTable.specification, pattern),
              ilike(productsTable.name, pattern),
              ilike(productsTable.code, pattern),
              ilike(productsTable.brand, pattern),
              ilike(productsTable.specification, pattern)
            )
          )
        );

      conditions.push(
        or(
          ilike(purchaseOrdersTable.orderNumber, pattern),
          ilike(purchaseOrdersTable.externalNumber, pattern),
          ilike(customersTable.legalName, pattern),
          ilike(customersTable.tradeName, pattern),
          inArray(purchaseOrdersTable.id, matchingOrderItems)
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
    const operationalData = await this.loadOperationalData(
      entityId,
      orderIds
    );

    return rows.map(({ order, customer }) => ({
      order: PurchaseOrderMapper.fromRows(
        order,
        itemRows.filter((item) => item.purchaseOrderId === order.id),
        operationalData.get(order.id)
      ),
      customer: CustomerItem.fromRow(customer),
    }));
  }

  async listOperationalItems({
    entityId,
    purchaseOrderItemId,
    search,
    customerId,
    status,
    deadline,
    sort,
    page,
    pageSize,
  }: {
    entityId: string;
    purchaseOrderItemId?: string;
    search?: string;
    customerId?: string;
    status?: PurchaseOrderItemProcurementStatus;
    deadline?: "OVERDUE" | "NEXT_7_DAYS" | "NO_DATE";
    sort:
      | "URGENCY"
      | "DELIVERY_ASC"
      | "DELIVERY_DESC"
      | "NEWEST"
      | "PRODUCT_ASC"
      | "ORDER_ASC";
    page: number;
    pageSize: number;
  }): Promise<PurchaseOrderItemQueuePage> {
    const acquiredTotals = this.databaseService.db
      .select({
        purchaseOrderItemId:
          acquisitionItemAllocationsTable.purchaseOrderItemId,
        acquiredQuantity:
          sql<number>`sum(${acquisitionItemAllocationsTable.allocatedQuantity})`.as(
            "acquired_quantity"
          ),
      })
      .from(acquisitionItemAllocationsTable)
      .innerJoin(
        acquisitionItemsTable,
        and(
          eq(
            acquisitionItemsTable.id,
            acquisitionItemAllocationsTable.acquisitionItemId
          ),
          eq(
            acquisitionItemsTable.entityId,
            acquisitionItemAllocationsTable.entityId
          )
        )
      )
      .innerJoin(
        acquisitionsTable,
        and(
          eq(acquisitionsTable.id, acquisitionItemsTable.acquisitionId),
          eq(acquisitionsTable.entityId, acquisitionItemsTable.entityId),
          ne(acquisitionsTable.status, "CANCELLED")
        )
      )
      .where(eq(acquisitionItemAllocationsTable.entityId, entityId))
      .groupBy(acquisitionItemAllocationsTable.purchaseOrderItemId)
      .as("acquired_totals");

    const receivedTotals = this.databaseService.db
      .select({
        purchaseOrderItemId:
          acquisitionReceiptItemsTable.purchaseOrderItemId,
        receivedQuantity:
          sql<number>`sum(${acquisitionReceiptItemsTable.receivedQuantity})`.as(
            "received_quantity"
          ),
      })
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
          ),
          eq(acquisitionReceiptsTable.status, "CONFIRMED")
        )
      )
      .where(eq(acquisitionReceiptItemsTable.entityId, entityId))
      .groupBy(acquisitionReceiptItemsTable.purchaseOrderItemId)
      .as("received_totals");

    const acquiredQuantity = sql<number>`coalesce(${acquiredTotals.acquiredQuantity}, 0)`;
    const receivedQuantity = sql<number>`coalesce(${receivedTotals.receivedQuantity}, 0)`;
    const procurementStatus = sql<PurchaseOrderItemProcurementStatus>`case
      when ${receivedQuantity} >= ${purchaseOrderItemsTable.orderedQuantity}
        then 'RECEIVED'
      when ${receivedQuantity} > 0
        then 'PARTIALLY_RECEIVED'
      when ${acquiredQuantity} >= ${purchaseOrderItemsTable.orderedQuantity}
        then 'PURCHASED'
      when ${acquiredQuantity} > 0
        then 'PARTIALLY_PURCHASED'
      else 'PENDING_PURCHASE'
    end`;
    const isOverdue = sql<boolean>`coalesce(
      ${purchaseOrdersTable.requestedDeliveryAt} < current_date
      and ${receivedQuantity} < ${purchaseOrderItemsTable.orderedQuantity},
      false
    )`;
    const baseConditions: SQL[] = [
      eq(purchaseOrderItemsTable.entityId, entityId),
      eq(
        purchaseOrdersTable.lifecycleStatus,
        PurchaseOrder.LifecycleStatus.ACTIVE
      ),
    ];

    if (purchaseOrderItemId) {
      baseConditions.push(
        eq(purchaseOrderItemsTable.id, purchaseOrderItemId)
      );
    }

    if (customerId) {
      baseConditions.push(eq(purchaseOrdersTable.customerId, customerId));
    }

    if (search) {
      const pattern = `%${search}%`;
      baseConditions.push(
        or(
          ilike(purchaseOrderItemsTable.description, pattern),
          ilike(purchaseOrderItemsTable.brand, pattern),
          ilike(productsTable.code, pattern),
          ilike(purchaseOrdersTable.orderNumber, pattern),
          ilike(purchaseOrdersTable.externalNumber, pattern),
          ilike(customersTable.legalName, pattern),
          ilike(customersTable.tradeName, pattern)
        )!
      );
    }

    if (deadline === "OVERDUE") {
      baseConditions.push(isOverdue);
    }

    if (deadline === "NEXT_7_DAYS") {
      baseConditions.push(sql`
        ${purchaseOrdersTable.requestedDeliveryAt} >= current_date
        and ${purchaseOrdersTable.requestedDeliveryAt} < current_date + interval '8 days'
        and ${receivedQuantity} < ${purchaseOrderItemsTable.orderedQuantity}
      `);
    }

    if (deadline === "NO_DATE") {
      baseConditions.push(
        sql`${purchaseOrdersTable.requestedDeliveryAt} is null`
      );
    }

    const itemConditions = [...baseConditions];
    if (status) {
      itemConditions.push(sql`${procurementStatus} = ${status}`);
    }

    const countStatus = (value: PurchaseOrderItemProcurementStatus) =>
      sql<number>`count(*) filter (where ${procurementStatus} = ${value})::integer`.mapWith(
        Number
      );
    const matchingItems = status
      ? countStatus(status)
      : sql<number>`count(*)::integer`.mapWith(Number);

    const summaryQuery = this.databaseService.db
      .select({
        total: sql<number>`count(*)::integer`.mapWith(Number),
        matchingItems,
        pendingPurchase: countStatus("PENDING_PURCHASE"),
        partiallyPurchased: countStatus("PARTIALLY_PURCHASED"),
        purchased: countStatus("PURCHASED"),
        partiallyReceived: countStatus("PARTIALLY_RECEIVED"),
        received: countStatus("RECEIVED"),
        overdue:
          sql<number>`count(*) filter (where ${isOverdue})::integer`.mapWith(
            Number
          ),
      })
      .from(purchaseOrderItemsTable)
      .innerJoin(
        purchaseOrdersTable,
        and(
          eq(
            purchaseOrdersTable.id,
            purchaseOrderItemsTable.purchaseOrderId
          ),
          eq(
            purchaseOrdersTable.entityId,
            purchaseOrderItemsTable.entityId
          )
        )
      )
      .innerJoin(
        customersTable,
        and(
          eq(customersTable.id, purchaseOrdersTable.customerId),
          eq(customersTable.entityId, purchaseOrdersTable.entityId)
        )
      )
      .innerJoin(
        productsTable,
        and(
          eq(productsTable.id, purchaseOrderItemsTable.productId),
          eq(productsTable.entityId, purchaseOrderItemsTable.entityId)
        )
      )
      .leftJoin(
        acquiredTotals,
        eq(
          acquiredTotals.purchaseOrderItemId,
          purchaseOrderItemsTable.id
        )
      )
      .leftJoin(
        receivedTotals,
        eq(
          receivedTotals.purchaseOrderItemId,
          purchaseOrderItemsTable.id
        )
      )
      .where(and(...baseConditions));

    const orderExpressions: SQL[] = (() => {
      if (sort === "DELIVERY_ASC") {
        return [
          sql`${purchaseOrdersTable.requestedDeliveryAt} asc nulls last`,
          asc(purchaseOrdersTable.issuedAt),
          asc(purchaseOrderItemsTable.lineNumber),
        ];
      }

      if (sort === "DELIVERY_DESC") {
        return [
          sql`${purchaseOrdersTable.requestedDeliveryAt} desc nulls last`,
          desc(purchaseOrdersTable.issuedAt),
          asc(purchaseOrderItemsTable.lineNumber),
        ];
      }

      if (sort === "NEWEST") {
        return [
          desc(purchaseOrdersTable.issuedAt),
          desc(purchaseOrderItemsTable.createdAt),
        ];
      }

      if (sort === "PRODUCT_ASC") {
        return [
          sql`lower(${purchaseOrderItemsTable.description}) asc`,
          asc(purchaseOrdersTable.orderNumber),
        ];
      }

      if (sort === "ORDER_ASC") {
        return [
          asc(purchaseOrdersTable.orderNumber),
          asc(purchaseOrderItemsTable.lineNumber),
        ];
      }

      return [
        sql`case
          when ${isOverdue} then 0
          when ${purchaseOrdersTable.requestedDeliveryAt} is not null then 1
          else 2
        end`,
        sql`${purchaseOrdersTable.requestedDeliveryAt} asc nulls last`,
        asc(purchaseOrdersTable.issuedAt),
        asc(purchaseOrderItemsTable.lineNumber),
      ];
    })();

    const itemsQuery = this.databaseService.db
      .select({
        id: purchaseOrderItemsTable.id,
        productId: purchaseOrderItemsTable.productId,
        productCode: productsTable.code,
        lineNumber: purchaseOrderItemsTable.lineNumber,
        description: purchaseOrderItemsTable.description,
        brand: purchaseOrderItemsTable.brand,
        specification: purchaseOrderItemsTable.specification,
        originalUnit: purchaseOrderItemsTable.originalUnit,
        orderedQuantity: sql<number>`${purchaseOrderItemsTable.orderedQuantity}::double precision`.mapWith(
          Number
        ),
        saleUnitPrice: sql<number>`${purchaseOrderItemsTable.saleUnitPrice}::double precision`.mapWith(
          Number
        ),
        officialTotal: sql<number>`${purchaseOrderItemsTable.officialTotal}::double precision`.mapWith(
          Number
        ),
        acquiredQuantity:
          sql<number>`${acquiredQuantity}::double precision`.mapWith(Number),
        purchasePendingQuantity:
          sql<number>`greatest(${purchaseOrderItemsTable.orderedQuantity} - ${acquiredQuantity}, 0)::double precision`.mapWith(
            Number
          ),
        receivedQuantity:
          sql<number>`${receivedQuantity}::double precision`.mapWith(Number),
        receiptPendingQuantity:
          sql<number>`greatest(${acquiredQuantity} - ${receivedQuantity}, 0)::double precision`.mapWith(
            Number
          ),
        procurementStatus,
        isOverdue,
        orderId: purchaseOrdersTable.id,
        orderNumber: purchaseOrdersTable.orderNumber,
        externalNumber: purchaseOrdersTable.externalNumber,
        issuedAt: purchaseOrdersTable.issuedAt,
        requestedDeliveryAt: purchaseOrdersTable.requestedDeliveryAt,
        customerId: customersTable.id,
        customerLegalName: customersTable.legalName,
        customerTradeName: customersTable.tradeName,
      })
      .from(purchaseOrderItemsTable)
      .innerJoin(
        purchaseOrdersTable,
        and(
          eq(
            purchaseOrdersTable.id,
            purchaseOrderItemsTable.purchaseOrderId
          ),
          eq(
            purchaseOrdersTable.entityId,
            purchaseOrderItemsTable.entityId
          )
        )
      )
      .innerJoin(
        customersTable,
        and(
          eq(customersTable.id, purchaseOrdersTable.customerId),
          eq(customersTable.entityId, purchaseOrdersTable.entityId)
        )
      )
      .innerJoin(
        productsTable,
        and(
          eq(productsTable.id, purchaseOrderItemsTable.productId),
          eq(productsTable.entityId, purchaseOrderItemsTable.entityId)
        )
      )
      .leftJoin(
        acquiredTotals,
        eq(
          acquiredTotals.purchaseOrderItemId,
          purchaseOrderItemsTable.id
        )
      )
      .leftJoin(
        receivedTotals,
        eq(
          receivedTotals.purchaseOrderItemId,
          purchaseOrderItemsTable.id
        )
      )
      .where(and(...itemConditions))
      .orderBy(...orderExpressions)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [[summary], rows] = await Promise.all([summaryQuery, itemsQuery]);
    const total = summary?.matchingItems ?? 0;

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productCode: row.productCode ?? undefined,
        lineNumber: row.lineNumber,
        description: row.description,
        brand: row.brand,
        specification: row.specification ?? undefined,
        originalUnit: row.originalUnit,
        orderedQuantity: row.orderedQuantity,
        saleUnitPrice: row.saleUnitPrice,
        officialTotal: row.officialTotal,
        acquiredQuantity: row.acquiredQuantity,
        purchasePendingQuantity: row.purchasePendingQuantity,
        receivedQuantity: row.receivedQuantity,
        receiptPendingQuantity: row.receiptPendingQuantity,
        procurementStatus: row.procurementStatus,
        isOverdue: row.isOverdue,
        order: {
          id: row.orderId,
          orderNumber: row.orderNumber,
          externalNumber: row.externalNumber ?? undefined,
          issuedAt: row.issuedAt,
          requestedDeliveryAt: row.requestedDeliveryAt ?? undefined,
        },
        customer: {
          id: row.customerId,
          legalName: row.customerLegalName,
          tradeName: row.customerTradeName ?? undefined,
        },
      })),
      summary: {
        total: summary?.total ?? 0,
        pendingPurchase: summary?.pendingPurchase ?? 0,
        partiallyPurchased: summary?.partiallyPurchased ?? 0,
        purchased: summary?.purchased ?? 0,
        partiallyReceived: summary?.partiallyReceived ?? 0,
        received: summary?.received ?? 0,
        overdue: summary?.overdue ?? 0,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
      },
    };
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

    const [itemRows, operationalData] = await Promise.all([
      this.databaseService.db
        .select()
        .from(purchaseOrderItemsTable)
        .where(
          and(
            eq(purchaseOrderItemsTable.purchaseOrderId, purchaseOrderId),
            eq(purchaseOrderItemsTable.entityId, entityId)
          )
        )
        .orderBy(asc(purchaseOrderItemsTable.lineNumber)),
      this.loadOperationalData(entityId, [purchaseOrderId]),
    ]);

    return {
      order: PurchaseOrderMapper.fromRows(
        row.order,
        itemRows,
        operationalData.get(purchaseOrderId)
      ),
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

  async hasAcquisitions({
    entityId,
    purchaseOrderId,
  }: {
    entityId: string;
    purchaseOrderId: string;
  }): Promise<boolean> {
    const [row] = await this.databaseService.db
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
          eq(acquisitionItemAllocationsTable.entityId, entityId),
          eq(purchaseOrderItemsTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .limit(1);

    return Boolean(row);
  }

  async findItemContexts({
    entityId,
    purchaseOrderItemIds,
  }: {
    entityId: string;
    purchaseOrderItemIds: string[];
  }): Promise<PurchaseOrderItemContext[]> {
    if (!purchaseOrderItemIds.length) return [];

    const rows = await this.databaseService.db
      .select({
        item: purchaseOrderItemsTable,
        order: purchaseOrdersTable,
        customer: customersTable,
      })
      .from(purchaseOrderItemsTable)
      .innerJoin(
        purchaseOrdersTable,
        eq(purchaseOrdersTable.id, purchaseOrderItemsTable.purchaseOrderId)
      )
      .innerJoin(
        customersTable,
        eq(customersTable.id, purchaseOrdersTable.customerId)
      )
      .where(
        and(
          eq(purchaseOrderItemsTable.entityId, entityId),
          inArray(purchaseOrderItemsTable.id, purchaseOrderItemIds)
        )
      );

    return rows.map(({ item, order, customer }) => ({
      item: PurchaseOrderMapper.itemFromRow(item),
      purchaseOrderId: order.id,
      orderNumber: order.orderNumber,
      customerName: customer.tradeName || customer.legalName,
      lifecycleStatus: order.lifecycleStatus as PurchaseOrder.LifecycleStatus,
    }));
  }

  private async loadOperationalData(
    entityId: string,
    purchaseOrderIds: string[]
  ): Promise<Map<string, PurchaseOrderOperationalData>> {
    const result = new Map<string, PurchaseOrderOperationalData>();

    purchaseOrderIds.forEach((purchaseOrderId) => {
      result.set(purchaseOrderId, {
        acquiredQuantityByItemId: new Map(),
        receivedQuantityByItemId: new Map(),
        committedDeliveryQuantityByItemId: new Map(),
        deliveredQuantityByItemId: new Map(),
        invoicedQuantityByItemId: new Map(),
        acquisitionCount: 0,
        knownAcquisitionCost: 0,
        deliveryCount: 0,
        deliveryCost: 0,
        invoiceCount: 0,
        invoicedRevenue: 0,
        taxCost: 0,
        otherDeductions: 0,
        receivedRevenue: 0,
        receivableBalance: 0,
      });
    });

    const [acquisitionRows, receiptRows, deliveryRows, invoiceRows] =
      await Promise.all([
        this.databaseService.db
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
              eq(acquisitionsTable.entityId, entityId),
              inArray(
                purchaseOrderItemsTable.purchaseOrderId,
                purchaseOrderIds
              )
            )
          ),
        this.databaseService.db
          .select()
          .from(acquisitionReceiptsTable)
          .where(
            and(
              eq(acquisitionReceiptsTable.entityId, entityId),
              inArray(
                acquisitionReceiptsTable.purchaseOrderId,
                purchaseOrderIds
              )
            )
          ),
        this.databaseService.db
          .select()
          .from(deliveriesTable)
          .where(
            and(
              eq(deliveriesTable.entityId, entityId),
              inArray(deliveriesTable.purchaseOrderId, purchaseOrderIds)
            )
          ),
        this.databaseService.db
          .select()
          .from(invoicesTable)
          .where(
            and(
              eq(invoicesTable.entityId, entityId),
              inArray(invoicesTable.purchaseOrderId, purchaseOrderIds)
            )
          ),
      ]);

    const acquisitions = acquisitionRows.map(({ acquisition }) => acquisition);
    deliveryRows.forEach((delivery) => {
      result.get(delivery.purchaseOrderId)!.deliveryCount += 1;
    });
    invoiceRows.forEach((invoice) => {
      result.get(invoice.purchaseOrderId)!.invoiceCount += 1;
    });

    const activeAcquisitions = acquisitions.filter(
      (acquisition) => acquisition.status !== "CANCELLED"
    );
    const confirmedReceipts = receiptRows.filter(
      (receipt) => receipt.status === "CONFIRMED"
    );
    const activeDeliveries = deliveryRows.filter(
      (delivery) => delivery.status !== "CANCELLED"
    );
    const deliveredDeliveries = activeDeliveries.filter(
      (delivery) => delivery.status === "DELIVERED"
    );
    const issuedInvoices = invoiceRows.filter(
      (invoice) => invoice.status === "ISSUED"
    );

    const [
      acquisitionItemRows,
      receiptItemRows,
      deliveryItemRows,
      invoiceItemRows,
      paymentRows,
    ] = await Promise.all([
      acquisitions.length
        ? this.databaseService.db
            .select()
            .from(acquisitionItemsTable)
            .where(
              and(
                eq(acquisitionItemsTable.entityId, entityId),
                inArray(
                  acquisitionItemsTable.acquisitionId,
                  acquisitions.map((acquisition) => acquisition.id)
                )
              )
            )
        : Promise.resolve([]),
      confirmedReceipts.length
        ? this.databaseService.db
            .select()
            .from(acquisitionReceiptItemsTable)
            .where(
              and(
                eq(acquisitionReceiptItemsTable.entityId, entityId),
                inArray(
                  acquisitionReceiptItemsTable.receiptId,
                  confirmedReceipts.map((receipt) => receipt.id)
                )
              )
            )
        : Promise.resolve([]),
      activeDeliveries.length
        ? this.databaseService.db
            .select()
            .from(deliveryItemsTable)
            .where(
              and(
                eq(deliveryItemsTable.entityId, entityId),
                inArray(
                  deliveryItemsTable.deliveryId,
                  activeDeliveries.map((delivery) => delivery.id)
                )
              )
            )
        : Promise.resolve([]),
      issuedInvoices.length
        ? this.databaseService.db
            .select()
            .from(invoiceItemsTable)
            .where(
              and(
                eq(invoiceItemsTable.entityId, entityId),
                inArray(
                  invoiceItemsTable.invoiceId,
                  issuedInvoices.map((invoice) => invoice.id)
                )
              )
            )
        : Promise.resolve([]),
      issuedInvoices.length
        ? this.databaseService.db
            .select()
            .from(receivablePaymentsTable)
            .where(
              and(
                eq(receivablePaymentsTable.entityId, entityId),
                eq(receivablePaymentsTable.status, "CONFIRMED"),
                inArray(
                  receivablePaymentsTable.invoiceId,
                  issuedInvoices.map((invoice) => invoice.id)
                )
              )
            )
        : Promise.resolve([]),
    ]);

    const acquisitionAllocationRows = acquisitionItemRows.length
      ? await this.databaseService.db
          .select()
          .from(acquisitionItemAllocationsTable)
          .where(
            and(
              eq(acquisitionItemAllocationsTable.entityId, entityId),
              inArray(
                acquisitionItemAllocationsTable.acquisitionItemId,
                acquisitionItemRows.map((item) => item.id)
              )
            )
          )
      : [];
    const allocatedOrderItemRows = acquisitionAllocationRows.length
      ? await this.databaseService.db
          .select()
          .from(purchaseOrderItemsTable)
          .where(
            and(
              eq(purchaseOrderItemsTable.entityId, entityId),
              inArray(
                purchaseOrderItemsTable.id,
                acquisitionAllocationRows.map(
                  (allocation) => allocation.purchaseOrderItemId
                )
              )
            )
          )
      : [];

    const receiptById = new Map(
      confirmedReceipts.map((receipt) => [receipt.id, receipt])
    );
    const deliveryById = new Map(
      activeDeliveries.map((delivery) => [delivery.id, delivery])
    );
    const deliveredDeliveryIds = new Set(
      deliveredDeliveries.map((delivery) => delivery.id)
    );
    const invoiceById = new Map(
      issuedInvoices.map((invoice) => [invoice.id, invoice])
    );

    const orderItemById = new Map(
      allocatedOrderItemRows.map((item) => [item.id, item])
    );
    const countedAcquisitionsByOrder = new Map<string, Set<string>>();

    acquisitions.forEach((acquisitionRow) => {
      const itemRows = acquisitionItemRows.filter(
        (item) => item.acquisitionId === acquisitionRow.id
      );
      const domain = AcquisitionMapper.fromRows(
        acquisitionRow,
        itemRows,
        acquisitionAllocationRows
      );
      const allocationCosts = calculateAcquisitionAllocationCosts(domain);

      domain.items.forEach((item) => {
        item.allocations.forEach((allocation) => {
          const orderItem = orderItemById.get(allocation.purchaseOrderItemId);
          if (!orderItem || !result.has(orderItem.purchaseOrderId)) return;
          const data = result.get(orderItem.purchaseOrderId)!;
          const counted = countedAcquisitionsByOrder.get(orderItem.purchaseOrderId) ?? new Set<string>();
          counted.add(acquisitionRow.id);
          countedAcquisitionsByOrder.set(orderItem.purchaseOrderId, counted);

          if (acquisitionRow.status === "CANCELLED") return;
          data.acquiredQuantityByItemId.set(
            allocation.purchaseOrderItemId,
            (data.acquiredQuantityByItemId.get(allocation.purchaseOrderItemId) ?? 0) +
              allocation.allocatedQuantity
          );
          data.knownAcquisitionCost +=
            allocationCosts.get(allocation)?.totalCost ?? 0;
        });
      });
    });

    countedAcquisitionsByOrder.forEach((ids, purchaseOrderId) => {
      result.get(purchaseOrderId)!.acquisitionCount = ids.size;
    });

    receiptItemRows.forEach((item) => {
      const receipt = receiptById.get(item.receiptId)!;
      const data = result.get(receipt.purchaseOrderId)!;
      data.receivedQuantityByItemId.set(
        item.purchaseOrderItemId,
        (data.receivedQuantityByItemId.get(item.purchaseOrderItemId) ??
          0) + Number(item.receivedQuantity)
      );
    });

    activeDeliveries.forEach((delivery) => {
      result.get(delivery.purchaseOrderId)!.deliveryCost += Number(
        delivery.freightCost
      );
    });

    deliveryItemRows.forEach((item) => {
      const delivery = deliveryById.get(item.deliveryId)!;
      const data = result.get(delivery.purchaseOrderId)!;
      data.committedDeliveryQuantityByItemId.set(
        item.purchaseOrderItemId,
        (data.committedDeliveryQuantityByItemId.get(
          item.purchaseOrderItemId
        ) ?? 0) + Number(item.deliveredQuantity)
      );

      if (deliveredDeliveryIds.has(item.deliveryId)) {
        data.deliveredQuantityByItemId.set(
          item.purchaseOrderItemId,
          (data.deliveredQuantityByItemId.get(item.purchaseOrderItemId) ??
            0) + Number(item.deliveredQuantity)
        );
      }
    });

    issuedInvoices.forEach((invoice) => {
      const data = result.get(invoice.purchaseOrderId)!;
      data.invoicedRevenue += Number(invoice.grossAmount);
      data.taxCost += Number(invoice.taxAmount);
      data.otherDeductions += Number(invoice.otherDeductions);
      data.receivableBalance +=
        Number(invoice.grossAmount) - Number(invoice.otherDeductions);
    });

    invoiceItemRows.forEach((item) => {
      const invoice = invoiceById.get(item.invoiceId)!;
      const data = result.get(invoice.purchaseOrderId)!;
      data.invoicedQuantityByItemId.set(
        item.purchaseOrderItemId,
        (data.invoicedQuantityByItemId.get(item.purchaseOrderItemId) ??
          0) + Number(item.invoicedQuantity)
      );
    });

    paymentRows.forEach((payment) => {
      const invoice = invoiceById.get(payment.invoiceId)!;
      const data = result.get(invoice.purchaseOrderId)!;
      data.receivedRevenue += Number(payment.amount);
      data.receivableBalance -= Number(payment.amount);
    });

    result.forEach((data) => {
      [
        "knownAcquisitionCost",
        "deliveryCost",
        "invoicedRevenue",
        "taxCost",
        "otherDeductions",
        "receivedRevenue",
        "receivableBalance",
      ].forEach((key) => {
        const typedKey = key as keyof Pick<
          PurchaseOrderOperationalData,
          | "knownAcquisitionCost"
          | "deliveryCost"
          | "invoicedRevenue"
          | "taxCost"
          | "otherDeductions"
          | "receivedRevenue"
          | "receivableBalance"
        >;
        data[typedKey] =
          Math.round((data[typedKey] + Number.EPSILON) * 100) / 100;
      });
      data.receivableBalance = Math.max(data.receivableBalance, 0);
    });

    return result;
  }
}
