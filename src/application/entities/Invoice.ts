import { financialCalendarDay } from "@shared/utils/financialCalendarDay";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class InvoiceItem {
  readonly id?: string;
  readonly entityId: string;
  readonly invoiceId?: string;
  readonly purchaseOrderItemId?: string;
  readonly lineNumber?: number;
  readonly description?: string;
  readonly originalUnit?: string;
  readonly invoicedQuantity: number;
  readonly unitPrice: number;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: InvoiceItem.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.invoiceId = attributes.invoiceId;
    this.purchaseOrderItemId = attributes.purchaseOrderItemId;
    this.lineNumber = attributes.lineNumber;
    this.description = attributes.description;
    this.originalUnit = attributes.originalUnit;
    this.invoicedQuantity = attributes.invoicedQuantity;
    this.unitPrice = attributes.unitPrice;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get totalAmount(): number {
    return roundMoney(this.invoicedQuantity * this.unitPrice);
  }
}

export namespace InvoiceItem {
  export type Attributes = {
    id?: string;
    entityId: string;
    invoiceId?: string;
    purchaseOrderItemId?: string;
    lineNumber?: number;
    description?: string;
    originalUnit?: string;
    invoicedQuantity: number;
    unitPrice: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class ReceivablePayment {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId?: string;
  readonly invoiceId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly receivedAt: Date;
  readonly amount: number;
  readonly paymentMethod: string;
  readonly reference?: string;
  readonly status: ReceivablePayment.Status;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: ReceivablePayment.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.invoiceId = attributes.invoiceId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.receivedAt = attributes.receivedAt;
    this.amount = attributes.amount;
    this.paymentMethod = attributes.paymentMethod;
    this.reference = attributes.reference;
    this.status =
      attributes.status ?? ReceivablePayment.Status.CONFIRMED;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get isCancelled(): boolean {
    return this.status === ReceivablePayment.Status.CANCELLED;
  }
}

export namespace ReceivablePayment {
  export enum Status {
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId?: string;
    invoiceId: string;
    createdByUserId: string;
    updatedByUserId: string;
    receivedAt: Date;
    amount: number;
    paymentMethod: string;
    reference?: string;
    status?: Status;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class Invoice {
  readonly id?: string;
  readonly entityId: string;
  readonly purchaseOrderId?: string;
  readonly customerId?: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly invoiceNumber: string;
  readonly issuedAt: Date;
  readonly dueAt: Date;
  readonly taxAmount: number;
  readonly otherDeductions: number;
  readonly status: Invoice.Status;
  readonly notes?: string;
  readonly items: InvoiceItem[];
  readonly payments: ReceivablePayment[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Invoice.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.purchaseOrderId = attributes.purchaseOrderId;
    this.customerId = attributes.customerId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.invoiceNumber = attributes.invoiceNumber;
    this.issuedAt = attributes.issuedAt;
    this.dueAt = attributes.dueAt;
    this.taxAmount = attributes.taxAmount ?? 0;
    this.otherDeductions = attributes.otherDeductions ?? 0;
    this.status = attributes.status ?? Invoice.Status.DRAFT;
    this.notes = attributes.notes;
    this.items = attributes.items;
    this.payments = attributes.payments ?? [];
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get grossAmount(): number {
    return roundMoney(
      this.items.reduce((total, item) => total + item.totalAmount, 0)
    );
  }

  get netReceivableAmount(): number {
    return Math.max(
      roundMoney(this.grossAmount - this.otherDeductions),
      0
    );
  }

  get receivedAmount(): number {
    return roundMoney(
      this.payments
        .filter((payment) => !payment.isCancelled)
        .reduce((total, payment) => total + payment.amount, 0)
    );
  }

  get outstandingAmount(): number {
    return Math.max(
      roundMoney(this.netReceivableAmount - this.receivedAmount),
      0
    );
  }

  get receivableStatus(): Invoice.ReceivableStatus {
    if (this.status === Invoice.Status.CANCELLED) {
      return Invoice.ReceivableStatus.CANCELLED;
    }

    if (this.status === Invoice.Status.DRAFT) {
      return Invoice.ReceivableStatus.NOT_ISSUED;
    }

    if (this.outstandingAmount <= 0) {
      return Invoice.ReceivableStatus.RECEIVED;
    }

    if (this.receivedAmount > 0) {
      return Invoice.ReceivableStatus.PARTIALLY_RECEIVED;
    }

    const today = financialCalendarDay();
    if (this.dueAt.getTime() < today.getTime()) {
      return Invoice.ReceivableStatus.OVERDUE;
    }

    return Invoice.ReceivableStatus.OPEN;
  }
}

export namespace Invoice {
  export enum Status {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    CANCELLED = "CANCELLED",
  }

  export enum ReceivableStatus {
    NOT_ISSUED = "NOT_ISSUED",
    OPEN = "OPEN",
    OVERDUE = "OVERDUE",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    RECEIVED = "RECEIVED",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    purchaseOrderId?: string;
    customerId?: string;
    createdByUserId: string;
    updatedByUserId: string;
    invoiceNumber: string;
    issuedAt: Date;
    dueAt: Date;
    taxAmount?: number;
    otherDeductions?: number;
    status?: Status;
    notes?: string;
    items: InvoiceItem[];
    payments?: ReceivablePayment[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
