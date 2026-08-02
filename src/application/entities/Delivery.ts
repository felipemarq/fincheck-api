export class DeliveryItem {
  readonly id?: string;
  readonly entityId: string;
  readonly deliveryId?: string;
  readonly purchaseOrderItemId: string;
  readonly deliveredQuantity: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: DeliveryItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.deliveryId = attributes.deliveryId;
    this.purchaseOrderItemId = attributes.purchaseOrderItemId;
    this.deliveredQuantity = attributes.deliveredQuantity;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace DeliveryItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    deliveryId?: string;
    purchaseOrderItemId: string;
    deliveredQuantity: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class Delivery {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly status: Delivery.Status;
  readonly dispatchedAt?: Date;
  readonly deliveredAt?: Date;
  readonly recipientName?: string;
  readonly trackingCode?: string;
  readonly freightCost: number;
  readonly notes?: string;
  readonly items: DeliveryItem[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Delivery.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.status = attributes.status ?? Delivery.Status.PREPARING;
    this.dispatchedAt = attributes.dispatchedAt;
    this.deliveredAt = attributes.deliveredAt;
    this.recipientName = attributes.recipientName;
    this.trackingCode = attributes.trackingCode;
    this.freightCost = attributes.freightCost ?? 0;
    this.notes = attributes.notes;
    this.items = attributes.items;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get totalQuantity(): number {
    return this.items.reduce(
      (total, item) => total + item.deliveredQuantity,
      0
    );
  }

  get isCancelled(): boolean {
    return this.status === Delivery.Status.CANCELLED;
  }

  get isDelivered(): boolean {
    return this.status === Delivery.Status.DELIVERED;
  }
}

export namespace Delivery {
  export enum Status {
    PREPARING = "PREPARING",
    DISPATCHED = "DISPATCHED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId: string;
    createdByUserId: string;
    updatedByUserId: string;
    status?: Status;
    dispatchedAt?: Date;
    deliveredAt?: Date;
    recipientName?: string;
    trackingCode?: string;
    freightCost?: number;
    notes?: string;
    items: DeliveryItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
