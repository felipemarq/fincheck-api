export class Product {
  readonly id?: string;
  readonly entityId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly code?: string;
  readonly name: string;
  readonly brand: string;
  readonly specification?: string;
  readonly packaging: string;
  readonly normalizedUnit: string;
  readonly lastPurchasePrice?: number;
  readonly lastPurchaseSource?: string;
  readonly lastPurchasedAt?: Date;
  readonly lastSalePrice?: number;
  readonly lastSoldAt?: Date;
  readonly active: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Product.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.code = attributes.code;
    this.name = attributes.name;
    this.brand = attributes.brand || "Outros";
    this.specification = attributes.specification;
    this.packaging = attributes.packaging;
    this.normalizedUnit = attributes.normalizedUnit || "UNIT";
    this.lastPurchasePrice = attributes.lastPurchasePrice;
    this.lastPurchaseSource = attributes.lastPurchaseSource;
    this.lastPurchasedAt = attributes.lastPurchasedAt;
    this.lastSalePrice = attributes.lastSalePrice;
    this.lastSoldAt = attributes.lastSoldAt;
    this.active = attributes.active ?? true;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace Product {
  export type Attributes = {
    id?: string;
    entityId: string;
    createdByUserId: string;
    updatedByUserId: string;
    code?: string;
    name: string;
    brand?: string;
    specification?: string;
    packaging: string;
    normalizedUnit?: string;
    lastPurchasePrice?: number;
    lastPurchaseSource?: string;
    lastPurchasedAt?: Date;
    lastSalePrice?: number;
    lastSoldAt?: Date;
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
