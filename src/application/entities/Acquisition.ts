function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class AcquisitionAllocation {
  readonly id?: string;
  readonly entityId: string;
  readonly acquisitionItemId?: string;
  readonly purchaseOrderItemId: string;
  readonly allocatedQuantity: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: AcquisitionAllocation.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.acquisitionItemId = attributes.acquisitionItemId;
    this.purchaseOrderItemId = attributes.purchaseOrderItemId;
    this.allocatedQuantity = attributes.allocatedQuantity;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace AcquisitionAllocation {
  export type Attributes = {
    id?: string;
    entityId: string;
    acquisitionItemId?: string;
    purchaseOrderItemId: string;
    allocatedQuantity: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class AcquisitionItem {
  readonly id?: string;
  readonly entityId: string;
  readonly acquisitionId?: string;
  readonly productId: string;
  readonly acquiredQuantity: number;
  readonly costUnitPrice: number;
  readonly lineDiscount: number;
  readonly notes?: string;
  readonly allocations: AcquisitionAllocation[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: AcquisitionItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.acquisitionId = attributes.acquisitionId;
    this.productId = attributes.productId;
    this.acquiredQuantity = attributes.acquiredQuantity;
    this.costUnitPrice = attributes.costUnitPrice;
    this.lineDiscount = attributes.lineDiscount ?? 0;
    this.notes = attributes.notes;
    this.allocations = attributes.allocations ?? [];
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get grossCost(): number {
    return roundMoney(this.acquiredQuantity * this.costUnitPrice);
  }

  get totalCost(): number {
    return roundMoney(this.grossCost - this.lineDiscount);
  }

  get allocatedQuantity(): number {
    return this.allocations.reduce(
      (total, allocation) => total + allocation.allocatedQuantity,
      0
    );
  }

  get unallocatedQuantity(): number {
    return Math.max(this.acquiredQuantity - this.allocatedQuantity, 0);
  }
}

export namespace AcquisitionItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    acquisitionId?: string;
    productId: string;
    acquiredQuantity: number;
    costUnitPrice: number;
    lineDiscount?: number;
    notes?: string;
    allocations?: AcquisitionAllocation[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class Acquisition {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId?: string;
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
  readonly creditCardId?: string;
  readonly installmentCount: number;
  readonly firstPaymentDueAt?: Date;
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
    this.creditCardId = attributes.creditCardId;
    this.installmentCount = attributes.installmentCount ?? 1;
    this.firstPaymentDueAt = attributes.firstPaymentDueAt;
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
  export enum PaymentMethod {
    PIX = "PIX",
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
    BOLETO = "BOLETO",
    BANK_TRANSFER = "BANK_TRANSFER",
    CASH = "CASH",
    OTHER = "OTHER",
  }

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
    purchaseOrderId?: string;
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
    creditCardId?: string;
    installmentCount?: number;
    firstPaymentDueAt?: Date;
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
