import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { FinancialAccessService } from "@application/services/FinancialAccessService";
import { DatabaseService } from "@infra/database/neon";
import { InvoiceRepository } from "@infra/database/neon/repositories/InvoiceRepository";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { CreateInvoiceUseCase } from "./CreateInvoiceUseCase";
import { UpdateInvoiceUseCase } from "./UpdateInvoiceUseCase";
import { ListInvoicesUseCase } from "./ListInvoicesUseCase";
import { CreateReceivablePaymentUseCase } from "./CreateReceivablePaymentUseCase";
import { UpdateReceivablePaymentUseCase } from "./UpdateReceivablePaymentUseCase";
import { ListReceivablesUseCase } from "../receivables/ListReceivablesUseCase";
import { GetOperationsDashboardUseCase } from "../dashboard/GetOperationsDashboardUseCase";

export async function invoiceTestFixture() {
  const pg = new PGlite();
  const migration = "0015_independent-invoices.sql";
  for (const file of readdirSync("drizzle")
    .filter((file) => file.endsWith(".sql") && file !== migration)
    .sort()) {
    await pg.exec(readFileSync(`drizzle/${file}`, "utf8"));
  }
  const userId = randomUUID(),
    otherUserId = randomUUID(),
    entityId = randomUUID(),
    otherEntityId = randomUUID();
  const customerId = randomUUID(),
    otherCustomerId = randomUUID(),
    orderId = randomUUID(),
    orderItemId = randomUUID(),
    productId = randomUUID();
  const legacyInvoiceId = randomUUID(),
    legacyPaymentId = randomUUID(),
    legacyItemId = randomUUID();
  await pg.query(
    "insert into users(id,name,email) values ($1,'Teste',$2), ($3,'Outro',$4)",
    [
      userId,
      `${userId}@example.test`,
      otherUserId,
      `${otherUserId}@example.test`,
    ],
  );
  await pg.query(
    "insert into entities(id,owner_user_id,name) values ($1,$2,'Empresa teste'), ($3,$4,'Outra empresa')",
    [entityId, userId, otherEntityId, otherUserId],
  );
  await pg.query(
    "insert into customers(id,entity_id,created_by_user_id,updated_by_user_id,legal_name,document) values ($1,$2,$3,$3,'Hospital teste','123'),($4,$5,$6,$6,'Outro hospital','456')",
    [customerId, entityId, userId, otherCustomerId, otherEntityId, otherUserId],
  );
  await pg.query(
    "insert into products(id,entity_id,created_by_user_id,updated_by_user_id,name,packaging) values ($1,$2,$3,$3,'Produto teste','UN')",
    [productId, entityId, userId],
  );
  await pg.query(
    "insert into purchase_orders(id,entity_id,customer_id,created_by_user_id,updated_by_user_id,order_number,issued_at,official_total,lifecycle_status) values ($1,$2,$3,$4,$4,'OC-ANTIGA','2026-11-01T12:00:00Z',200,'ACTIVE')",
    [orderId, entityId, customerId, userId],
  );
  await pg.query(
    "insert into purchase_order_items(id,entity_id,purchase_order_id,product_id,line_number,description,brand,original_unit,normalized_unit,ordered_quantity,sale_unit_price,official_total) values ($1,$2,$3,$4,1,'Descrição fiscal original','Outros','UN','UNIT',10,20,200)",
    [orderItemId, entityId, orderId, productId],
  );
  await pg.query(
    "insert into invoices(id,entity_id,purchase_order_id,created_by_user_id,updated_by_user_id,invoice_number,issued_at,due_at,gross_amount,status) values ($1,$2,$3,$4,$4,'NF-ANTIGA','2026-11-01T12:00:00Z','2026-12-01T12:00:00Z',200,'ISSUED')",
    [legacyInvoiceId, entityId, orderId, userId],
  );
  await pg.query(
    "insert into invoice_items(id,entity_id,invoice_id,purchase_order_item_id,invoiced_quantity,unit_price,total_amount) values ($1,$2,$3,$4,10,20,200)",
    [legacyItemId, entityId, legacyInvoiceId, orderItemId],
  );
  await pg.query(
    "insert into receivable_payments(id,entity_id,purchase_order_id,invoice_id,created_by_user_id,updated_by_user_id,received_at,amount,payment_method) values ($1,$2,$3,$4,$5,$5,'2026-11-02T12:00:00Z',40,'PIX')",
    [legacyPaymentId, entityId, orderId, legacyInvoiceId, userId],
  );
  await pg.exec(readFileSync(`drizzle/${migration}`, "utf8"));
  const db = drizzle(pg);
  Object.assign(db, {
    batch: (queries: Array<{ toSQL(): { sql: string; params: unknown[] } }>) =>
      pg.transaction(async (tx) => {
        const results = [];
        for (const query of queries) {
          const statement = query.toSQL();
          results.push(await tx.query(statement.sql, statement.params));
        }
        return results;
      }),
  });
  const database = { db } as unknown as DatabaseService;
  const invoices = new InvoiceRepository(database),
    orders = new PurchaseOrderRepository(database);
  const customers = new CustomerRepository(database),
    access = new FinancialAccessService(database);
  return {
    pg,
    invoices,
    orders,
    access,
    entityId,
    otherEntityId,
    userId,
    otherUserId,
    customerId,
    otherCustomerId,
    orderId,
    orderItemId,
    legacyInvoiceId,
    legacyPaymentId,
    legacyItemId,
    create: new CreateInvoiceUseCase(invoices, orders, access, customers),
    update: new UpdateInvoiceUseCase(invoices, orders, access, customers),
    list: new ListInvoicesUseCase(invoices, orders, access),
    receive: new CreateReceivablePaymentUseCase(invoices, access),
    updatePayment: new UpdateReceivablePaymentUseCase(invoices, access),
    receivables: new ListReceivablesUseCase(invoices, orders, access),
    dashboard: new GetOperationsDashboardUseCase(orders, invoices, access),
  };
}
