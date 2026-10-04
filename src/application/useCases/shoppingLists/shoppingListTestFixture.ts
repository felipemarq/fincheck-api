import "reflect-metadata";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { DatabaseService } from "@infra/database/neon";
import { ShoppingListRepository } from "@infra/database/neon/repositories/ShoppingListRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { AcquisitionPreparationService } from "@application/services/AcquisitionPreparationService";
import { AcquisitionViewService } from "@application/services/AcquisitionViewService";
import { PaymentConfigurationService } from "@application/services/PaymentConfigurationService";
import { ShoppingListAccessService } from "@application/services/ShoppingListAccessService";
import { ShoppingListService } from "./ShoppingListService";

export async function shoppingListTestFixture() {
  const pg = new PGlite();
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync(`drizzle/${file}`, "utf8"));
  }
  const db = drizzle(pg);
  Object.assign(db, { batch: (queries: Array<{ toSQL(): { sql: string; params: unknown[] } }>) => pg.transaction(async tx => {
    const results = [];
    for (const query of queries) { const statement = query.toSQL(); results.push(await tx.query(statement.sql, statement.params)); }
    return results;
  }) });
  const database = { db } as unknown as DatabaseService;
  const userId = randomUUID(), otherUserId = randomUUID(), entityId = randomUUID(), otherEntityId = randomUUID();
  const productId = randomUUID(), customerId = randomUUID(), orderId = randomUUID(), orderItemId = randomUUID();
  await pg.query("insert into users(id, name, email) values ($1, 'Pessoa teste', $2), ($3, 'Outra pessoa', $4)", [userId, `${userId}@example.test`, otherUserId, `${otherUserId}@example.test`]);
  await pg.query("insert into entities(id, owner_user_id, name) values ($1, $2, 'Equipe teste'), ($3, $4, 'Outra organização')", [entityId, userId, otherEntityId, otherUserId]);
  await pg.query("insert into products(id, entity_id, created_by_user_id, updated_by_user_id, name, packaging) values ($1,$2,$3,$3,'Luvas de procedimento','Caixa')", [productId, entityId, userId]);
  await pg.query("insert into customers(id,entity_id,created_by_user_id,updated_by_user_id,legal_name,document) values ($1,$2,$3,$3,'Hospital teste','TESTE')", [customerId, entityId, userId]);
  await pg.query("insert into purchase_orders(id,entity_id,customer_id,created_by_user_id,updated_by_user_id,order_number,issued_at,official_total,lifecycle_status) values ($1,$2,$3,$4,$4,'OC-TESTE',now(),200,'ACTIVE')", [orderId, entityId, customerId, userId]);
  await pg.query("insert into purchase_order_items(id,entity_id,purchase_order_id,product_id,line_number,description,brand,original_unit,normalized_unit,ordered_quantity,sale_unit_price,official_total) values ($1,$2,$3,$4,1,'Luvas tamanho M','Outros','CX','UNIT',10,20,200)", [orderItemId, entityId, orderId, productId]);
  const repository = new ShoppingListRepository(database);
  const products = new ProductRepository(database), orders = new PurchaseOrderRepository(database);
  const acquisitions = new AcquisitionRepository(database), access = new ShoppingListAccessService(database);
  const views = new AcquisitionViewService(products, orders);
  const service = new ShoppingListService(repository, access, orders, products, new AcquisitionPreparationService(products, orders), new PaymentConfigurationService(new CreditCardRepository(database)), acquisitions, views);
  const list = await repository.create(entityId, userId, { name: "Compras da semana", notes: null });
  return { pg, db, database, repository, service, access, products, orders, acquisitions, userId, otherUserId, entityId, otherEntityId, productId, customerId, orderId, orderItemId, list };
}
