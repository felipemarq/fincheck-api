import { Product } from "@application/entities/Product";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { DatabaseService } from "..";
import { ProductItem } from "../items/ProductItem";
import { productsTable, purchaseOrderItemsTable } from "../schema";

@Injectable()
export class ProductRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(product: Product): Promise<Product> {
    const [created] = await this.databaseService.db
      .insert(productsTable)
      .values(ProductItem.toRow(product))
      .returning();

    return ProductItem.fromRow(created);
  }

  async listAll({
    entityId,
    search,
    active,
  }: {
    entityId: string;
    search?: string;
    active?: boolean;
  }): Promise<Product[]> {
    const conditions = [eq(productsTable.entityId, entityId)];

    if (search) {
      conditions.push(
        or(
          ilike(productsTable.name, `%${search}%`),
          ilike(productsTable.brand, `%${search}%`),
          ilike(productsTable.specification, `%${search}%`),
          ilike(productsTable.lastPurchaseSource, `%${search}%`)
        )!
      );
    }

    if (active !== undefined) {
      conditions.push(eq(productsTable.active, active));
    }

    const rows = await this.databaseService.db
      .select()
      .from(productsTable)
      .where(and(...conditions))
      .orderBy(desc(productsTable.active), asc(productsTable.name));

    return rows.map(ProductItem.fromRow);
  }

  async findOne({
    productId,
    entityId,
  }: {
    productId: string;
    entityId: string;
  }): Promise<Product | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.id, productId),
          eq(productsTable.entityId, entityId)
        )
      )
      .limit(1);

    return row ? ProductItem.fromRow(row) : null;
  }

  async findDuplicate({
    entityId,
    name,
    brand,
    packaging,
  }: {
    entityId: string;
    name: string;
    brand: string;
    packaging: string;
  }): Promise<Product | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.entityId, entityId),
          sql`lower(trim(${productsTable.name})) = ${name.trim().toLowerCase()}`,
          sql`lower(trim(${productsTable.brand})) = ${brand.trim().toLowerCase()}`,
          sql`lower(trim(${productsTable.packaging})) = ${packaging
            .trim()
            .toLowerCase()}`
        )
      )
      .limit(1);

    return row ? ProductItem.fromRow(row) : null;
  }

  async update(product: Product): Promise<Product> {
    const { id: _id, ...values } = ProductItem.toRow(product);
    const [updated] = await this.databaseService.db
      .update(productsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(productsTable.id, product.id!),
          eq(productsTable.entityId, product.entityId)
        )
      )
      .returning();

    return ProductItem.fromRow(updated);
  }

  async isUsed({
    productId,
    entityId,
  }: {
    productId: string;
    entityId: string;
  }): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ id: purchaseOrderItemsTable.id })
      .from(purchaseOrderItemsTable)
      .where(
        and(
          eq(purchaseOrderItemsTable.productId, productId),
          eq(purchaseOrderItemsTable.entityId, entityId)
        )
      )
      .limit(1);

    return Boolean(row);
  }

  async delete({
    productId,
    entityId,
  }: {
    productId: string;
    entityId: string;
  }): Promise<void> {
    await this.databaseService.db
      .delete(productsTable)
      .where(
        and(
          eq(productsTable.id, productId),
          eq(productsTable.entityId, entityId)
        )
      );
  }

  async recordSalePrices({
    entityId,
    userId,
    soldAt,
    items,
  }: {
    entityId: string;
    userId: string;
    soldAt: Date;
    items: Array<{ productId: string; unitPrice: number }>;
  }): Promise<void> {
    await Promise.all(
      items.map(({ productId, unitPrice }) =>
        this.databaseService.db
          .update(productsTable)
          .set({
            lastSalePrice: unitPrice.toFixed(6),
            lastSoldAt: soldAt,
            updatedByUserId: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productsTable.id, productId),
              eq(productsTable.entityId, entityId),
              or(
                isNull(productsTable.lastSoldAt),
                lte(productsTable.lastSoldAt, soldAt)
              )
            )
          )
      )
    );
  }

  async recordPurchasePrices({
    entityId,
    userId,
    purchasedAt,
    source,
    items,
  }: {
    entityId: string;
    userId: string;
    purchasedAt: Date;
    source?: string;
    items: Array<{ productId: string; unitPrice: number }>;
  }): Promise<void> {
    await Promise.all(
      items.map(({ productId, unitPrice }) =>
        this.databaseService.db
          .update(productsTable)
          .set({
            lastPurchasePrice: unitPrice.toFixed(6),
            lastPurchaseSource: source ?? null,
            lastPurchasedAt: purchasedAt,
            updatedByUserId: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productsTable.id, productId),
              eq(productsTable.entityId, entityId),
              or(
                isNull(productsTable.lastPurchasedAt),
                lte(productsTable.lastPurchasedAt, purchasedAt)
              )
            )
          )
      )
    );
  }
}
