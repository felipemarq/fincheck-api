import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { alias, PgTable } from "drizzle-orm/pg-core";
import { Injectable } from "@kernel/decorators/Injectable";
import { ShoppingList, ShoppingListItem } from "@application/entities/ShoppingList";
import { ShoppingItemInput } from "@application/controllers/shoppingLists/shoppingListSchemas";
import { Acquisition } from "@application/entities/Acquisition";
import { buildPaymentSchedule } from "@application/services/buildPaymentSchedule";
import { ConflictException } from "@application/errors/http/ConflictException";
import { DatabaseService } from "..";
import { AcquisitionMapper } from "../items/AcquisitionItem";
import { PayableItem } from "../items/PayableItem";
import { acquisitionItemAllocationsTable, acquisitionItemsTable, acquisitionsTable, payablesTable, productsTable, purchaseOrderItemsTable, purchaseOrdersTable, shoppingListItemsTable as items, shoppingListsTable as lists, usersTable } from "../schema";

function insertFrom(table: PgTable, rows: Record<string, unknown>[], anchor: string) {
  const columns = getTableColumns(table);
  const keys = Object.keys(rows[0]).filter(key => rows[0][key] !== undefined);
  // Cast each parameter using its column's native type, including UUIDs and enums.
  const values = rows.map(row => sql`(${sql.join(keys.map(key => {
    const value = row[key] instanceof Date ? (row[key] as Date).toISOString() : row[key] ?? null;
    return sql`${value}::${sql.raw(columns[key].getSQLType())}`;
  }), sql`, `)})`);
  return sql`insert into ${table} (${sql.join(keys.map(key => sql.identifier(columns[key].name)), sql`, `)})
    select * from (values ${sql.join(values, sql`, `)}) as v
    where exists (select 1 from ${sql.identifier(anchor)}) returning id`;
}

@Injectable()
export class ShoppingListRepository {
  constructor(private readonly database: DatabaseService) {}

  async list(entityId: string): Promise<ShoppingList[]> {
    const rows = await this.database.db.select({
      ...getTableColumns(lists),
      totalItems: sql<number>`count(${items.id})::int`,
      purchasedItems: sql<number>`count(${items.id}) filter (where ${items.purchasedAt} is not null)::int`,
      estimatedTotal: sql<string>`coalesce(sum(${items.quantity} * ${items.estimatedUnitPrice}), 0)`,
    }).from(lists).leftJoin(items, and(eq(items.shoppingListId, lists.id), eq(items.entityId, entityId)))
      .where(eq(lists.entityId, entityId)).groupBy(lists.id).orderBy(asc(lists.archived), desc(lists.updatedAt));
    return rows.map(row => ({ ...row, estimatedTotal: Number(row.estimatedTotal) }));
  }

  async findList(entityId: string, listId: string) {
    const [row] = await this.database.db.select().from(lists).where(and(eq(lists.entityId, entityId), eq(lists.id, listId)));
    return row ?? null;
  }

  async create(entityId: string, userId: string, input: { name: string; notes: string | null }) {
    const [list] = await this.database.db.insert(lists).values({ ...input, entityId, createdByUserId: userId, updatedByUserId: userId }).returning();
    return list;
  }

  async updateList(entityId: string, listId: string, userId: string, input: { name?: string; notes?: string | null; archived?: boolean }) {
    const [list] = await this.database.db.update(lists).set({ ...input, updatedByUserId: userId, updatedAt: new Date() })
      .where(and(eq(lists.entityId, entityId), eq(lists.id, listId))).returning();
    return list;
  }

  async listItems(entityId: string, listId: string): Promise<ShoppingListItem[]> {
    const buyer = alias(usersTable, "shopping_buyer");
    const rows = await this.database.db.select({
      ...getTableColumns(items), productName: productsTable.name, orderNumber: purchaseOrdersTable.orderNumber,
      orderItemDescription: purchaseOrderItemsTable.description, createdByName: usersTable.name, purchasedByName: buyer.name,
    }).from(items)
      .leftJoin(productsTable, and(eq(productsTable.id, items.productId), eq(productsTable.entityId, entityId)))
      .leftJoin(purchaseOrdersTable, and(eq(purchaseOrdersTable.id, items.purchaseOrderId), eq(purchaseOrdersTable.entityId, entityId)))
      .leftJoin(purchaseOrderItemsTable, and(eq(purchaseOrderItemsTable.id, items.purchaseOrderItemId), eq(purchaseOrderItemsTable.entityId, entityId)))
      .leftJoin(usersTable, eq(usersTable.id, items.createdByUserId)).leftJoin(buyer, eq(buyer.id, items.purchasedByUserId))
      .where(and(eq(items.entityId, entityId), eq(items.shoppingListId, listId))).orderBy(asc(items.createdAt), asc(items.id));
    return rows.map(row => ({ ...row, priority: row.priority as ShoppingListItem["priority"],
      quantity: row.quantity === null ? null : Number(row.quantity),
      estimatedUnitPrice: row.estimatedUnitPrice === null ? null : Number(row.estimatedUnitPrice) }));
  }

  async findItem(entityId: string, listId: string, itemId: string): Promise<ShoppingListItem | null> {
    const [row] = await this.database.db.select().from(items).where(and(eq(items.entityId, entityId), eq(items.shoppingListId, listId), eq(items.id, itemId)));
    return row ? { ...row, priority: row.priority as ShoppingListItem["priority"],
      quantity: row.quantity === null ? null : Number(row.quantity), estimatedUnitPrice: row.estimatedUnitPrice === null ? null : Number(row.estimatedUnitPrice) } : null;
  }

  async addItems(entityId: string, listId: string, userId: string, input: ShoppingItemInput[]) {
    await this.database.db.batch([
      this.database.db.insert(items).values(input.map(item => ({ ...item, entityId, shoppingListId: listId,
        quantity: item.quantity?.toFixed(3) ?? null, estimatedUnitPrice: item.estimatedUnitPrice?.toFixed(6) ?? null,
        createdByUserId: userId, updatedByUserId: userId }))),
      this.touchList(entityId, listId, userId),
    ]);
  }

  async updateItem(current: ShoppingListItem, userId: string, input: ShoppingItemInput) {
    const [row] = await this.database.db.update(items).set({ ...input,
      quantity: input.quantity?.toFixed(3) ?? null, estimatedUnitPrice: input.estimatedUnitPrice?.toFixed(6) ?? null,
      version: current.version + 1, updatedByUserId: userId, updatedAt: new Date(),
    }).where(this.editCondition(current)).returning();
    this.assertChanged(row);
    await this.touchList(current.entityId, current.shoppingListId, userId);
  }

  async check(current: ShoppingListItem, userId: string, purchased: boolean) {
    const [row] = await this.database.db.update(items).set({ purchasedAt: purchased ? new Date() : null,
      purchasedByUserId: purchased ? userId : null, version: current.version + 1, updatedByUserId: userId, updatedAt: new Date(),
    }).where(this.editCondition(current)).returning();
    this.assertChanged(row);
    await this.touchList(current.entityId, current.shoppingListId, userId);
  }

  async remove(current: ShoppingListItem) {
    const [row] = await this.database.db.delete(items).where(this.editCondition(current)).returning();
    this.assertChanged(row);
    await this.touchList(current.entityId, current.shoppingListId, current.updatedByUserId);
  }

  /** One SQL statement: checklist, acquisition, destinations and payments commit together. */
  async purchase(current: ShoppingListItem, userId: string, acquisition: Acquisition) {
    const lineRows = acquisition.items.map(item => ({ ...AcquisitionMapper.itemToRow(item, acquisition.id!), id: item.id ?? randomUUID() }));
    const allocations = acquisition.items.flatMap((item, index) => item.allocations.map(allocation => ({
      ...AcquisitionMapper.allocationToRow(allocation, lineRows[index].id), id: allocation.id ?? randomUUID(),
    })));
    const payableRows = buildPaymentSchedule(acquisition).map(payable => ({ ...PayableItem.toRow(payable), id: randomUUID() }));
    const ctes = [
      sql`locked as (update ${items} set purchased_at = now(), purchased_by_user_id = ${userId}::uuid,
        acquisition_id = ${acquisition.id}::uuid, version = version + 1, updated_by_user_id = ${userId}::uuid, updated_at = now()
        where ${this.editCondition(current)} returning id)`,
      sql`purchase as (${insertFrom(acquisitionsTable, [{ ...AcquisitionMapper.toRow(acquisition), id: acquisition.id! }], "locked")})`,
      sql`lines as (${insertFrom(acquisitionItemsTable, lineRows, "purchase")})`,
      sql`payments as (${insertFrom(payablesTable, payableRows, "purchase")})`,
    ];
    if (allocations.length) ctes.push(sql`destinations as (${insertFrom(acquisitionItemAllocationsTable, allocations, "lines")})`);
    const result = await this.database.db.execute(sql`with ${sql.join(ctes, sql`, `)} select id from purchase`);
    this.assertChanged(result.rows[0]);
    await this.touchList(current.entityId, current.shoppingListId, userId);
  }

  private editCondition(current: ShoppingListItem) {
    return and(eq(items.entityId, current.entityId), eq(items.shoppingListId, current.shoppingListId), eq(items.id, current.id),
      eq(items.version, current.version), isNull(items.acquisitionId),
      sql`exists (select 1 from ${lists} where ${lists.id} = ${current.shoppingListId}::uuid and ${lists.entityId} = ${current.entityId}::uuid and ${lists.archived} = false)`);
  }
  private touchList(entityId: string, listId: string, userId: string) {
    return this.database.db.update(lists).set({ updatedAt: new Date(), updatedByUserId: userId }).where(and(eq(lists.entityId, entityId), eq(lists.id, listId)));
  }
  private assertChanged(row: unknown) {
    if (!row) throw new ConflictException("Este item foi alterado por outra pessoa. Atualize a lista e tente novamente.");
  }
}
