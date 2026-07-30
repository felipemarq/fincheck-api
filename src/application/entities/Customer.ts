export class Customer {
  readonly id?: string;
  readonly entityId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly legalName: string;
  readonly tradeName?: string;
  readonly document: string;
  readonly email?: string;
  readonly phone?: string;
  readonly billingAddress?: string;
  readonly deliveryAddress?: string;
  readonly notes?: string;
  readonly active: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Customer.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.legalName = attributes.legalName;
    this.tradeName = attributes.tradeName;
    this.document = attributes.document;
    this.email = attributes.email;
    this.phone = attributes.phone;
    this.billingAddress = attributes.billingAddress;
    this.deliveryAddress = attributes.deliveryAddress;
    this.notes = attributes.notes;
    this.active = attributes.active ?? true;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace Customer {
  export type Attributes = {
    id?: string;
    entityId: string;
    createdByUserId: string;
    updatedByUserId: string;
    legalName: string;
    tradeName?: string;
    document: string;
    email?: string;
    phone?: string;
    billingAddress?: string;
    deliveryAddress?: string;
    notes?: string;
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
