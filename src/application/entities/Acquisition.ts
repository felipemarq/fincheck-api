function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class AcquisitionItem {
  readonly id?: string;
  readonly entityId: string;
  readonly acquisitionId?: string;
  readonly purchaseOrderItemId: string;
  readonly acquiredQuantity: number;
  readonly costUnitPrice: number;
  readonly lineDiscount: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: AcquisitionItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.acquisitionId = attributes.acquisitionId;
    this.purchaseOrderItemId = attributes.purchaseOrderItemId;
    this.acquiredQuantity = attributes.acquiredQuantity;
    this.costUnitPrice = attributes.costUnitPrice;
    this.lineDiscount = attributes.lineDiscount ?? 0;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get grossCost(): number {
    return roundMoney(this.acquiredQuantity * this.costUnitPrice);
  }

  get totalCost(): number {
    return roundMoney(this.grossCost - this.lineDiscount);
  }
}

export namespace AcquisitionItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    acquisitionId?: string;
    purchaseOrderItemId: string;
    acquiredQuantity: number;
    costUnitPrice: number;
    lineDiscount?: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class Acquisition {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly sellerName?: string;
  readonly sellerDocument?: string;
  readonly channel?: string;
  readonly sellerOrderNumber?: string;
  readonly purchasedAt: Date;
  readonly buyerName: string;
  readonly paymentMethod: string;
  readonly paymentInstrument?: string;
  readonly paymentHolder?: string;
  readonly shippingCost: number;
  readonly generalDiscount: number;
  readonly otherExpenses: number;
  readonly status: Acquisition.Status;
  readonly notes?: string;
  readonly items: AcquisitionItem[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Acquisition.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.sellerName = attributes.sellerName;
    this.sellerDocument = attributes.sellerDocument;
    this.channel = attributes.channel;
    this.sellerOrderNumber = attributes.sellerOrderNumber;
    this.purchasedAt = attributes.purchasedAt;
    this.buyerName = attributes.buyerName;
    this.paymentMethod = attributes.paymentMethod;
    this.paymentInstrument = attributes.paymentInstrument;
    this.paymentHolder = attributes.paymentHolder;
    this.shippingCost = attributes.shippingCost ?? 0;
    this.generalDiscount = attributes.generalDiscount ?? 0;
    this.otherExpenses = attributes.otherExpenses ?? 0;
    this.status = attributes.status ?? Acquisition.Status.PLACED;
    this.notes = attributes.notes;
    this.items = attributes.items;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get itemsSubtotal(): number {
    return roundMoney(
      this.items.reduce((total, item) => total + item.totalCost, 0)
    );
  }

  get totalCost(): number {
    return roundMoney(
      this.itemsSubtotal +
        this.shippingCost +
        this.otherExpenses -
        this.generalDiscount
    );
  }

  get isCancelled(): boolean {
    return this.status === Acquisition.Status.CANCELLED;
  }
}

export namespace Acquisition {
  export enum Status {
    PLACED = "PLACED",
    IN_TRANSIT = "IN_TRANSIT",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    RECEIVED = "RECEIVED",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId: string;
    createdByUserId: string;
    updatedByUserId: string;
    sellerName?: string;
    sellerDocument?: string;
    channel?: string;
    sellerOrderNumber?: string;
    purchasedAt: Date;
    buyerName: string;
    paymentMethod: string;
    paymentInstrument?: string;
    paymentHolder?: string;
    shippingCost?: number;
    generalDiscount?: number;
    otherExpenses?: number;
    status?: Status;
    notes?: string;
    items: AcquisitionItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
