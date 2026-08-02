import { Customer } from "@application/entities/Customer";
import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
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
  acquisitionItemsTable,
  acquisitionReceiptItemsTable,
  acquisitionReceiptsTable,
  acquisitionsTable,
  customersTable,
  deliveriesTable,
  deliveryItemsTable,
  invoiceItemsTable,
  invoicesTable,
  purchaseOrderItemsTable,
  purchaseOrdersTable,
  receivablePaymentsTable,
} from "../schema";

export type PurchaseOrderWithCustomer = {
  order: PurchaseOrder;
  customer: Customer;
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
    const operationalData = await this.loadOperationalData(entityId, [
      purchaseOrderId,
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
      .select({ id: acquisitionsTable.id })
      .from(acquisitionsTable)
      .where(
        and(
          eq(acquisitionsTable.entityId, entityId),
          eq(acquisitionsTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .limit(1);

    return Boolean(row);
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
          .select()
          .from(acquisitionsTable)
          .where(
            and(
              eq(acquisitionsTable.entityId, entityId),
              inArray(
                acquisitionsTable.purchaseOrderId,
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

    acquisitionRows.forEach((acquisition) => {
      const data = result.get(acquisition.purchaseOrderId)!;
      data.acquisitionCount += 1;
    });
    deliveryRows.forEach((delivery) => {
      result.get(delivery.purchaseOrderId)!.deliveryCount += 1;
    });
    invoiceRows.forEach((invoice) => {
      result.get(invoice.purchaseOrderId)!.invoiceCount += 1;
    });

    const activeAcquisitions = acquisitionRows.filter(
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
      activeAcquisitions.length
        ? this.databaseService.db
            .select()
            .from(acquisitionItemsTable)
            .where(
              and(
                eq(acquisitionItemsTable.entityId, entityId),
                inArray(
                  acquisitionItemsTable.acquisitionId,
                  activeAcquisitions.map((acquisition) => acquisition.id)
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

    const acquisitionById = new Map(
      activeAcquisitions.map((acquisition) => [acquisition.id, acquisition])
    );
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

    activeAcquisitions.forEach((acquisition) => {
      const data = result.get(acquisition.purchaseOrderId)!;
      data.knownAcquisitionCost +=
        Number(acquisition.shippingCost) +
        Number(acquisition.otherExpenses) -
        Number(acquisition.generalDiscount);
    });

    acquisitionItemRows.forEach((item) => {
      const acquisition = acquisitionById.get(item.acquisitionId)!;
      const data = result.get(acquisition.purchaseOrderId)!;
      data.acquiredQuantityByItemId.set(
        item.purchaseOrderItemId,
        (data.acquiredQuantityByItemId.get(item.purchaseOrderItemId) ?? 0) +
          Number(item.acquiredQuantity)
      );
      data.knownAcquisitionCost += Number(item.totalCost);
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
