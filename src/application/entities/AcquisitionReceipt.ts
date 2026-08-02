export class AcquisitionReceiptItem {
  readonly id?: string;
  readonly entityId: string;
  readonly receiptId?: string;
  readonly acquisitionItemId: string;
  readonly purchaseOrderItemId: string;
  readonly receivedQuantity: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: AcquisitionReceiptItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.receiptId = attributes.receiptId;
    this.acquisitionItemId = attributes.acquisitionItemId;
    this.purchaseOrderItemId = attributes.purchaseOrderItemId;
    this.receivedQuantity = attributes.receivedQuantity;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace AcquisitionReceiptItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    receiptId?: string;
    acquisitionItemId: string;
    purchaseOrderItemId: string;
    receivedQuantity: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class AcquisitionReceipt {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId: string;
  readonly acquisitionId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly receivedAt: Date;
  readonly status: AcquisitionReceipt.Status;
  readonly notes?: string;
  readonly items: AcquisitionReceiptItem[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: AcquisitionReceipt.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.acquisitionId = attributes.acquisitionId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.receivedAt = attributes.receivedAt;
    this.status =
      attributes.status ?? AcquisitionReceipt.Status.CONFIRMED;
    this.notes = attributes.notes;
    this.items = attributes.items;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get totalQuantity(): number {
    return this.items.reduce(
      (total, item) => total + item.receivedQuantity,
      0
    );
  }

  get isCancelled(): boolean {
    return this.status === AcquisitionReceipt.Status.CANCELLED;
  }
}

export namespace AcquisitionReceipt {
  export enum Status {
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId: string;
    acquisitionId: string;
    createdByUserId: string;
    updatedByUserId: string;
    receivedAt: Date;
    status?: Status;
    notes?: string;
    items: AcquisitionReceiptItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
