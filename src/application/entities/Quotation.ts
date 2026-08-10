export class QuotationItemImage {
  readonly id!: string;
  readonly entityId!: string;
  readonly quotationId!: string;
  readonly quotationItemId!: string;
  readonly storageKey!: string;
  readonly fileName!: string;
  readonly contentType!: string;
  readonly size!: number;
  readonly sortOrder!: number;
  readonly createdAt?: Date;

  constructor(attributes: QuotationItemImage.Attributes) {
    Object.assign(this, attributes);
  }
}

export namespace QuotationItemImage {
  export type Attributes = {
    id: string;
    entityId: string;
    quotationId: string;
    quotationItemId: string;
    storageKey: string;
    fileName: string;
    contentType: string;
    size: number;
    sortOrder: number;
    createdAt?: Date;
  };
}

export class QuotationItem {
  readonly id!: string;
  readonly entityId!: string;
  readonly quotationId!: string;
  readonly productId!: string;
  readonly lineNumber!: number;
  readonly productCode?: string;
  readonly description!: string;
  readonly brand!: string;
  readonly specification?: string;
  readonly unit!: string;
  readonly quantity!: number;
  readonly unitPrice!: number;
  readonly total!: number;
  readonly notes?: string;
  readonly images!: QuotationItemImage[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: QuotationItem.Attributes) {
    Object.assign(this, attributes);
    this.images = attributes.images ?? [];
  }
}

export namespace QuotationItem {
  export type Attributes = {
    id: string;
    entityId: string;
    quotationId: string;
    productId: string;
    lineNumber: number;
    productCode?: string;
    description: string;
    brand: string;
    specification?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string;
    images?: QuotationItemImage[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export class Quotation {
  readonly id!: string;
  readonly entityId!: string;
  readonly customerId!: string;
  readonly createdByUserId!: string;
  readonly updatedByUserId!: string;
  readonly number!: string;
  readonly status!: Quotation.Status;
  readonly issuedAt!: Date;
  readonly validUntil?: Date;
  readonly sellerName!: string;
  readonly sellerDocument?: string;
  readonly sellerEmail?: string;
  readonly sellerPhone?: string;
  readonly sellerAddress?: string;
  readonly customerLegalName!: string;
  readonly customerTradeName?: string;
  readonly customerDocument!: string;
  readonly customerEmail?: string;
  readonly customerPhone?: string;
  readonly customerAddress?: string;
  readonly paymentTerms?: string;
  readonly deliveryTerms?: string;
  readonly notes?: string;
  readonly internalNotes?: string;
  readonly subtotal!: number;
  readonly freight!: number;
  readonly discount!: number;
  readonly total!: number;
  readonly items!: QuotationItem[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Quotation.Attributes) {
    Object.assign(this, attributes);
    this.status = attributes.status ?? Quotation.Status.DRAFT;
    this.freight = attributes.freight ?? 0;
    this.discount = attributes.discount ?? 0;
    this.items = attributes.items ?? [];
  }
}

export namespace Quotation {
  export enum Status {
    DRAFT = "DRAFT",
    SENT = "SENT",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
  }

  export type Attributes = {
    id: string;
    entityId: string;
    customerId: string;
    createdByUserId: string;
    updatedByUserId: string;
    number: string;
    status?: Status;
    issuedAt: Date;
    validUntil?: Date;
    sellerName: string;
    sellerDocument?: string;
    sellerEmail?: string;
    sellerPhone?: string;
    sellerAddress?: string;
    customerLegalName: string;
    customerTradeName?: string;
    customerDocument: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    notes?: string;
    internalNotes?: string;
    subtotal: number;
    freight?: number;
    discount?: number;
    total: number;
    items?: QuotationItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}
