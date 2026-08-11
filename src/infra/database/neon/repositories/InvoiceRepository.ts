import {
  Invoice,
  ReceivablePayment,
} from "@application/entities/Invoice";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import { DatabaseService } from "..";
import { InvoiceMapper } from "../items/InvoiceItem";
import {
  customersTable,
  invoiceItemsTable,
  invoicesTable,
  purchaseOrdersTable,
  receivablePaymentsTable,
} from "../schema";

export type InvoiceWithContext = {
  invoice: Invoice;
  orderNumber: string;
  orderExternalNumber?: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
};

@Injectable()
export class InvoiceRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(invoice: Invoice): Promise<Invoice> {
    const invoiceId = invoice.id ?? randomUUID();

    await this.databaseService.db.batch([
      this.databaseService.db.insert(invoicesTable).values({
        ...InvoiceMapper.toRow(invoice),
        id: invoiceId,
      }),
      this.databaseService.db.insert(invoiceItemsTable).values(
        invoice.items.map((item) =>
          InvoiceMapper.itemToRow(item, invoiceId)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: invoice.entityId,
      purchaseOrderId: invoice.purchaseOrderId,
      invoiceId,
    }))!;
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const { id: _id, ...values } = InvoiceMapper.toRow(invoice);

    await this.databaseService.db.batch([
      this.databaseService.db
        .update(invoicesTable)
        .set({ ...values, updatedAt: new Date() })
        .where(
          and(
            eq(invoicesTable.id, invoice.id!),
            eq(invoicesTable.entityId, invoice.entityId),
            eq(invoicesTable.purchaseOrderId, invoice.purchaseOrderId)
          )
        ),
      this.databaseService.db
        .delete(invoiceItemsTable)
        .where(
          and(
            eq(invoiceItemsTable.invoiceId, invoice.id!),
            eq(invoiceItemsTable.entityId, invoice.entityId)
          )
        ),
      this.databaseService.db.insert(invoiceItemsTable).values(
        invoice.items.map((item) =>
          InvoiceMapper.itemToRow(item, invoice.id!)
        )
      ),
    ]);

    return (await this.findOne({
      entityId: invoice.entityId,
      purchaseOrderId: invoice.purchaseOrderId,
      invoiceId: invoice.id!,
    }))!;
  }

  async listAll({
    entityId,
    purchaseOrderId,
  }: {
    entityId: string;
    purchaseOrderId: string;
  }): Promise<Invoice[]> {
    const rows = await this.databaseService.db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.entityId, entityId),
          eq(invoicesTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .orderBy(desc(invoicesTable.issuedAt), desc(invoicesTable.createdAt));

    if (!rows.length) {
      return [];
    }

    const invoiceIds = rows.map((row) => row.id);
    const [itemRows, paymentRows] = await Promise.all([
      this.databaseService.db
        .select()
        .from(invoiceItemsTable)
        .where(
          and(
            eq(invoiceItemsTable.entityId, entityId),
            inArray(invoiceItemsTable.invoiceId, invoiceIds)
          )
        )
        .orderBy(asc(invoiceItemsTable.createdAt)),
      this.databaseService.db
        .select()
        .from(receivablePaymentsTable)
        .where(
          and(
            eq(receivablePaymentsTable.entityId, entityId),
            inArray(receivablePaymentsTable.invoiceId, invoiceIds)
          )
        )
        .orderBy(desc(receivablePaymentsTable.receivedAt)),
    ]);

    return rows.map((row) =>
      InvoiceMapper.fromRows(
        row,
        itemRows.filter((item) => item.invoiceId === row.id),
        paymentRows.filter((payment) => payment.invoiceId === row.id)
      )
    );
  }

  async listAllForEntity({
    entityId,
  }: {
    entityId: string;
  }): Promise<InvoiceWithContext[]> {
    const rows = await this.databaseService.db
      .select({
        invoice: invoicesTable,
        order: purchaseOrdersTable,
        customer: customersTable,
      })
      .from(invoicesTable)
      .innerJoin(
        purchaseOrdersTable,
        and(
          eq(purchaseOrdersTable.id, invoicesTable.purchaseOrderId),
          eq(purchaseOrdersTable.entityId, invoicesTable.entityId)
        )
      )
      .innerJoin(
        customersTable,
        and(
          eq(customersTable.id, purchaseOrdersTable.customerId),
          eq(customersTable.entityId, invoicesTable.entityId)
        )
      )
      .where(eq(invoicesTable.entityId, entityId))
      .orderBy(asc(invoicesTable.dueAt), desc(invoicesTable.createdAt));

    if (!rows.length) {
      return [];
    }

    const invoiceIds = rows.map(({ invoice }) => invoice.id);
    const [itemRows, paymentRows] = await Promise.all([
      this.databaseService.db
        .select()
        .from(invoiceItemsTable)
        .where(
          and(
            eq(invoiceItemsTable.entityId, entityId),
            inArray(invoiceItemsTable.invoiceId, invoiceIds)
          )
        )
        .orderBy(asc(invoiceItemsTable.createdAt)),
      this.databaseService.db
        .select()
        .from(receivablePaymentsTable)
        .where(
          and(
            eq(receivablePaymentsTable.entityId, entityId),
            inArray(receivablePaymentsTable.invoiceId, invoiceIds)
          )
        )
        .orderBy(desc(receivablePaymentsTable.receivedAt)),
    ]);

    return rows.map(({ invoice, order, customer }) => ({
      invoice: InvoiceMapper.fromRows(
        invoice,
        itemRows.filter((item) => item.invoiceId === invoice.id),
        paymentRows.filter((payment) => payment.invoiceId === invoice.id)
      ),
      orderNumber: order.orderNumber,
      orderExternalNumber: order.externalNumber ?? undefined,
      customerId: customer.id,
      customerName: customer.tradeName || customer.legalName,
      customerDocument: customer.document,
    }));
  }

  async findOne({
    entityId,
    purchaseOrderId,
    invoiceId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    invoiceId: string;
  }): Promise<Invoice | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.id, invoiceId),
          eq(invoicesTable.entityId, entityId),
          eq(invoicesTable.purchaseOrderId, purchaseOrderId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const [itemRows, paymentRows] = await Promise.all([
      this.databaseService.db
        .select()
        .from(invoiceItemsTable)
        .where(
          and(
            eq(invoiceItemsTable.entityId, entityId),
            eq(invoiceItemsTable.invoiceId, invoiceId)
          )
        )
        .orderBy(asc(invoiceItemsTable.createdAt)),
      this.databaseService.db
        .select()
        .from(receivablePaymentsTable)
        .where(
          and(
            eq(receivablePaymentsTable.entityId, entityId),
            eq(receivablePaymentsTable.invoiceId, invoiceId)
          )
        )
        .orderBy(desc(receivablePaymentsTable.receivedAt)),
    ]);

    return InvoiceMapper.fromRows(row, itemRows, paymentRows);
  }

  async getInvoicedQuantityByOrderItem({
    entityId,
    purchaseOrderId,
    exceptInvoiceId,
  }: {
    entityId: string;
    purchaseOrderId: string;
    exceptInvoiceId?: string;
  }): Promise<Map<string, number>> {
    const conditions = [
      eq(invoicesTable.entityId, entityId),
      eq(invoicesTable.purchaseOrderId, purchaseOrderId),
      ne(invoicesTable.status, "CANCELLED"),
    ];

    if (exceptInvoiceId) {
      conditions.push(ne(invoicesTable.id, exceptInvoiceId));
    }

    const rows = await this.databaseService.db
      .select({ item: invoiceItemsTable })
      .from(invoiceItemsTable)
      .innerJoin(
        invoicesTable,
        and(
          eq(invoicesTable.id, invoiceItemsTable.invoiceId),
          eq(invoicesTable.entityId, invoiceItemsTable.entityId)
        )
      )
      .where(and(...conditions));

    const totals = new Map<string, number>();

    rows.forEach(({ item }) => {
      totals.set(
        item.purchaseOrderItemId,
        (totals.get(item.purchaseOrderItemId) ?? 0) +
          Number(item.invoicedQuantity)
      );
    });

    return totals;
  }

  async findByNumber({
    entityId,
    invoiceNumber,
    exceptInvoiceId,
  }: {
    entityId: string;
    invoiceNumber: string;
    exceptInvoiceId?: string;
  }): Promise<Invoice | null> {
    const conditions = [
      eq(invoicesTable.entityId, entityId),
      eq(invoicesTable.invoiceNumber, invoiceNumber),
    ];

    if (exceptInvoiceId) {
      conditions.push(ne(invoicesTable.id, exceptInvoiceId));
    }

    const [row] = await this.databaseService.db
      .select({ id: invoicesTable.id, purchaseOrderId: invoicesTable.purchaseOrderId })
      .from(invoicesTable)
      .where(and(...conditions))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.findOne({
      entityId,
      purchaseOrderId: row.purchaseOrderId,
      invoiceId: row.id,
    });
  }

  async hasConfirmedPayments({
    entityId,
    invoiceId,
  }: {
    entityId: string;
    invoiceId: string;
  }): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: receivablePaymentsTable.id })
      .from(receivablePaymentsTable)
      .where(
        and(
          eq(receivablePaymentsTable.entityId, entityId),
          eq(receivablePaymentsTable.invoiceId, invoiceId),
          eq(receivablePaymentsTable.status, "CONFIRMED")
        )
      )
      .limit(1);

    return Boolean(row);
  }

  async createPayment(
    payment: ReceivablePayment
  ): Promise<ReceivablePayment> {
    const [created] = await this.databaseService.db
      .insert(receivablePaymentsTable)
      .values(InvoiceMapper.paymentToRow(payment))
      .returning();

    return InvoiceMapper.paymentFromRow(created);
  }

  async updatePayment(
    payment: ReceivablePayment
  ): Promise<ReceivablePayment> {
    const { id: _id, ...values } = InvoiceMapper.paymentToRow(payment);
    const [updated] = await this.databaseService.db
      .update(receivablePaymentsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(receivablePaymentsTable.id, payment.id!),
          eq(receivablePaymentsTable.entityId, payment.entityId),
          eq(receivablePaymentsTable.invoiceId, payment.invoiceId)
        )
      )
      .returning();

    return InvoiceMapper.paymentFromRow(updated);
  }

  async findPayment({
    entityId,
    invoiceId,
    paymentId,
  }: {
    entityId: string;
    invoiceId: string;
    paymentId: string;
  }): Promise<ReceivablePayment | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(receivablePaymentsTable)
      .where(
        and(
          eq(receivablePaymentsTable.id, paymentId),
          eq(receivablePaymentsTable.entityId, entityId),
          eq(receivablePaymentsTable.invoiceId, invoiceId)
        )
      )
      .limit(1);

    return row ? InvoiceMapper.paymentFromRow(row) : null;
  }
}
