import { Product } from "@application/entities/Product";
import type { NewProductRow, ProductRow } from "../schema";

export class ProductItem {
  static fromRow(row: ProductRow): Product {
    return new Product({
      id: row.id,
      entityId: row.entityId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      name: row.name,
      brand: row.brand,
      specification: row.specification ?? undefined,
      packaging: row.packaging,
      normalizedUnit: row.normalizedUnit,
      lastPurchasePrice:
        row.lastPurchasePrice === null
          ? undefined
          : Number(row.lastPurchasePrice),
      lastPurchaseSource: row.lastPurchaseSource ?? undefined,
      lastPurchasedAt: row.lastPurchasedAt ?? undefined,
      lastSalePrice:
        row.lastSalePrice === null ? undefined : Number(row.lastSalePrice),
      lastSoldAt: row.lastSoldAt ?? undefined,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(product: Product): NewProductRow {
    return {
      id: product.id,
      entityId: product.entityId,
      createdByUserId: product.createdByUserId,
      updatedByUserId: product.updatedByUserId,
      name: product.name,
      brand: product.brand,
      specification: product.specification ?? null,
      packaging: product.packaging,
      normalizedUnit: product.normalizedUnit,
      lastPurchasePrice: product.lastPurchasePrice?.toFixed(6) ?? null,
      lastPurchaseSource: product.lastPurchaseSource ?? null,
      lastPurchasedAt: product.lastPurchasedAt ?? null,
      lastSalePrice: product.lastSalePrice?.toFixed(6) ?? null,
      lastSoldAt: product.lastSoldAt ?? null,
      active: product.active,
    };
  }
}
