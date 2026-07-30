export class PurchaseOrderItem {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId?: string;
  readonly lineNumber: number;
  readonly description: string;
  readonly brand: string;
  readonly specification?: string;
  readonly originalUnit: string;
  readonly normalizedUnit: string;
  readonly orderedQuantity: number;
  readonly saleUnitPrice: number;
  readonly officialTotal: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: PurchaseOrderItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.lineNumber = attributes.lineNumber;
    this.description = attributes.description;
    this.brand = attributes.brand;
    this.specification = attributes.specification;
    this.originalUnit = attributes.originalUnit;
    this.normalizedUnit = attributes.normalizedUnit;
    this.orderedQuantity = attributes.orderedQuantity;
    this.saleUnitPrice = attributes.saleUnitPrice;
    this.officialTotal = attributes.officialTotal;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace PurchaseOrderItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId?: string;
    lineNumber: number;
    description: string;
    brand: string;
    specification?: string;
    originalUnit: string;
    normalizedUnit: string;
    orderedQuantity: number;
    saleUnitPrice: number;
    officialTotal: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class PurchaseOrder {
  readonly id?: string;
  readonly entityId: string;
  readonly customerId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly orderNumber: string;
  readonly externalNumber?: string;
  readonly quoteNumber?: string;
  readonly requisitionNumber?: string;
  readonly issuedAt: Date;
  readonly requestedDeliveryAt?: Date;
  readonly officialTotal: number;
  readonly paymentTerms?: string;
  readonly instructions?: string;
  readonly notes?: string;
  readonly billingAddress?: string;
  readonly deliveryAddress?: string;
  readonly lifecycleStatus: PurchaseOrder.LifecycleStatus;
  readonly items: PurchaseOrderItem[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: PurchaseOrder.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.customerId = attributes.customerId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.orderNumber = attributes.orderNumber;
    this.externalNumber = attributes.externalNumber;
    this.quoteNumber = attributes.quoteNumber;
    this.requisitionNumber = attributes.requisitionNumber;
    this.issuedAt = attributes.issuedAt;
    this.requestedDeliveryAt = attributes.requestedDeliveryAt;
    this.officialTotal = attributes.officialTotal;
    this.paymentTerms = attributes.paymentTerms;
    this.instructions = attributes.instructions;
    this.notes = attributes.notes;
    this.billingAddress = attributes.billingAddress;
    this.deliveryAddress = attributes.deliveryAddress;
    this.lifecycleStatus =
      attributes.lifecycleStatus ?? PurchaseOrder.LifecycleStatus.DRAFT;
    this.items = attributes.items;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get calculatedItemsTotal(): number {
    const totalInCents = this.items.reduce(
      (total, item) => total + Math.round(item.officialTotal * 100),
      0
    );

    return totalInCents / 100;
  }

  get hasTotalMismatch(): boolean {
    return (
      Math.round(this.officialTotal * 100) !==
      Math.round(this.calculatedItemsTotal * 100)
    );
  }

  get progress(): PurchaseOrder.Progress {
    if (this.lifecycleStatus === PurchaseOrder.LifecycleStatus.DRAFT) {
      return PurchaseOrder.Progress.DRAFT;
    }

    if (this.lifecycleStatus === PurchaseOrder.LifecycleStatus.CANCELLED) {
      return PurchaseOrder.Progress.CANCELLED;
    }

    return PurchaseOrder.Progress.PENDING_PURCHASE;
  }
}

export namespace PurchaseOrder {
  export enum LifecycleStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
  }

  export enum Progress {
    DRAFT = "DRAFT",
    CANCELLED = "CANCELLED",
    PENDING_PURCHASE = "PENDING_PURCHASE",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    customerId: string;
    createdByUserId: string;
    updatedByUserId: string;
    orderNumber: string;
    externalNumber?: string;
    quoteNumber?: string;
    requisitionNumber?: string;
    issuedAt: Date;
    requestedDeliveryAt?: Date;
    officialTotal: number;
    paymentTerms?: string;
    instructions?: string;
    notes?: string;
    billingAddress?: string;
    deliveryAddress?: string;
    lifecycleStatus?: LifecycleStatus;
    items: PurchaseOrderItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
