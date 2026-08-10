export class PurchaseOrderItem {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId?: string;
  readonly productId: string;
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
  readonly acquiredQuantity: number;
  readonly receivedQuantity: number;
  readonly committedDeliveryQuantity: number;
  readonly deliveredQuantity: number;
  readonly invoicedQuantity: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: PurchaseOrderItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.productId = attributes.productId;
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
    this.acquiredQuantity = attributes.acquiredQuantity ?? 0;
    this.receivedQuantity = attributes.receivedQuantity ?? 0;
    this.committedDeliveryQuantity =
      attributes.committedDeliveryQuantity ?? 0;
    this.deliveredQuantity = attributes.deliveredQuantity ?? 0;
    this.invoicedQuantity = attributes.invoicedQuantity ?? 0;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get purchasePendingQuantity(): number {
    return Math.max(this.orderedQuantity - this.acquiredQuantity, 0);
  }

  get excessQuantity(): number {
    return Math.max(this.acquiredQuantity - this.orderedQuantity, 0);
  }

  get costCoveredRevenue(): number {
    const coveredQuantity = Math.min(
      this.acquiredQuantity,
      this.orderedQuantity
    );
    const coverage = coveredQuantity / this.orderedQuantity;

    return (
      Math.round((this.officialTotal * coverage + Number.EPSILON) * 100) /
      100
    );
  }

  get receiptPendingQuantity(): number {
    return Math.max(this.acquiredQuantity - this.receivedQuantity, 0);
  }

  get availableForDeliveryQuantity(): number {
    return Math.max(
      Math.min(this.receivedQuantity, this.orderedQuantity) -
        this.committedDeliveryQuantity,
      0
    );
  }

  get deliveryPendingQuantity(): number {
    return Math.max(this.orderedQuantity - this.deliveredQuantity, 0);
  }

  get invoicePendingQuantity(): number {
    return Math.max(
      this.committedDeliveryQuantity - this.invoicedQuantity,
      0
    );
  }

  get progress(): PurchaseOrder.ItemProgress {
    if (this.deliveredQuantity >= this.orderedQuantity) {
      return PurchaseOrder.ItemProgress.DELIVERED;
    }

    if (this.deliveredQuantity > 0) {
      return PurchaseOrder.ItemProgress.PARTIALLY_DELIVERED;
    }

    if (this.committedDeliveryQuantity > 0) {
      return PurchaseOrder.ItemProgress.IN_DELIVERY;
    }

    if (this.receivedQuantity >= this.orderedQuantity) {
      return PurchaseOrder.ItemProgress.RECEIVED_AWAITING_DELIVERY;
    }

    if (this.receivedQuantity > 0) {
      return PurchaseOrder.ItemProgress.PARTIALLY_RECEIVED;
    }

    if (this.acquiredQuantity >= this.orderedQuantity) {
      return PurchaseOrder.ItemProgress.PURCHASED_AWAITING_ARRIVAL;
    }

    if (this.acquiredQuantity > 0) {
      return PurchaseOrder.ItemProgress.PARTIALLY_PURCHASED;
    }

    return PurchaseOrder.ItemProgress.PENDING_PURCHASE;
  }
}

export namespace PurchaseOrderItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId?: string;
    productId: string;
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
    acquiredQuantity?: number;
    receivedQuantity?: number;
    committedDeliveryQuantity?: number;
    deliveredQuantity?: number;
    invoicedQuantity?: number;
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
  readonly acquisitionCount: number;
  readonly knownAcquisitionCost: number;
  readonly deliveryCount: number;
  readonly deliveryCost: number;
  readonly invoiceCount: number;
  readonly invoicedRevenue: number;
  readonly taxCost: number;
  readonly otherDeductions: number;
  readonly receivedRevenue: number;
  readonly receivableBalance: number;
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
    this.acquisitionCount = attributes.acquisitionCount ?? 0;
    this.knownAcquisitionCost = attributes.knownAcquisitionCost ?? 0;
    this.deliveryCount = attributes.deliveryCount ?? 0;
    this.deliveryCost = attributes.deliveryCost ?? 0;
    this.invoiceCount = attributes.invoiceCount ?? 0;
    this.invoicedRevenue = attributes.invoicedRevenue ?? 0;
    this.taxCost = attributes.taxCost ?? 0;
    this.otherDeductions = attributes.otherDeductions ?? 0;
    this.receivedRevenue = attributes.receivedRevenue ?? 0;
    this.receivableBalance = attributes.receivableBalance ?? 0;
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

    if (
      this.items.every(
        (item) =>
          item.progress === PurchaseOrder.ItemProgress.DELIVERED
      )
    ) {
      return PurchaseOrder.Progress.DELIVERED;
    }

    if (this.items.some((item) => item.deliveredQuantity > 0)) {
      return PurchaseOrder.Progress.PARTIALLY_DELIVERED;
    }

    if (
      this.items.some(
        (item) =>
          item.progress === PurchaseOrder.ItemProgress.IN_DELIVERY
      )
    ) {
      return PurchaseOrder.Progress.IN_DELIVERY;
    }

    if (
      this.items.every(
        (item) =>
          item.progress ===
          PurchaseOrder.ItemProgress.RECEIVED_AWAITING_DELIVERY
      )
    ) {
      return PurchaseOrder.Progress.READY_FOR_DELIVERY;
    }

    if (this.items.some((item) => item.receivedQuantity > 0)) {
      return PurchaseOrder.Progress.PARTIALLY_RECEIVED;
    }

    if (
      this.items.every(
        (item) =>
          item.progress ===
          PurchaseOrder.ItemProgress.PURCHASED_AWAITING_ARRIVAL
      )
    ) {
      return PurchaseOrder.Progress.PURCHASED;
    }

    if (this.items.some((item) => item.acquiredQuantity > 0)) {
      return PurchaseOrder.Progress.PARTIALLY_PURCHASED;
    }

    return PurchaseOrder.Progress.PENDING_PURCHASE;
  }

  get projectedMargin(): number {
    return (
      Math.round(
        (this.officialTotal -
          this.knownAcquisitionCost -
          this.deliveryCost -
          this.taxCost -
          this.otherDeductions +
          Number.EPSILON) *
          100
      ) / 100
    );
  }

  get costCoveredRevenue(): number {
    return (
      Math.round(
        (this.items.reduce(
          (total, item) => total + item.costCoveredRevenue,
          0
        ) +
          Number.EPSILON) *
          100
      ) / 100
    );
  }

  get knownCostMargin(): number {
    return (
      Math.round(
        (this.costCoveredRevenue -
          this.knownAcquisitionCost -
          this.deliveryCost -
          this.taxCost -
          this.otherDeductions +
          Number.EPSILON) *
          100
      ) / 100
    );
  }

  get invoicedMargin(): number {
    return (
      Math.round(
        (this.invoicedRevenue -
          this.knownAcquisitionCost -
          this.deliveryCost -
          this.taxCost -
          this.otherDeductions +
          Number.EPSILON) *
          100
      ) / 100
    );
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
    PARTIALLY_PURCHASED = "PARTIALLY_PURCHASED",
    PURCHASED = "PURCHASED",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY",
    IN_DELIVERY = "IN_DELIVERY",
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED",
    DELIVERED = "DELIVERED",
  }

  export enum ItemProgress {
    PENDING_PURCHASE = "PENDING_PURCHASE",
    PARTIALLY_PURCHASED = "PARTIALLY_PURCHASED",
    PURCHASED_AWAITING_ARRIVAL = "PURCHASED_AWAITING_ARRIVAL",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    RECEIVED_AWAITING_DELIVERY = "RECEIVED_AWAITING_DELIVERY",
    IN_DELIVERY = "IN_DELIVERY",
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED",
    DELIVERED = "DELIVERED",
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
    acquisitionCount?: number;
    knownAcquisitionCost?: number;
    deliveryCount?: number;
    deliveryCost?: number;
    invoiceCount?: number;
    invoicedRevenue?: number;
    taxCost?: number;
    otherDeductions?: number;
    receivedRevenue?: number;
    receivableBalance?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
