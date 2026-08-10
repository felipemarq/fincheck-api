export class Payable {
  readonly id?: string;
  readonly entityId: string;
  readonly acquisitionId: string;
  readonly creditCardId?: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly description: string;
  readonly paymentMethod: string;
  readonly installmentNumber: number;
  readonly installmentCount: number;
  readonly amount: number;
  readonly dueAt: Date;
  readonly status: Payable.Status;
  readonly paidAt?: Date;
  readonly notes?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: Payable.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.acquisitionId = attributes.acquisitionId;
    this.creditCardId = attributes.creditCardId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.description = attributes.description;
    this.paymentMethod = attributes.paymentMethod;
    this.installmentNumber = attributes.installmentNumber;
    this.installmentCount = attributes.installmentCount;
    this.amount = attributes.amount;
    this.dueAt = attributes.dueAt;
    this.status = attributes.status;
    this.paidAt = attributes.paidAt;
    this.notes = attributes.notes;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace Payable {
  export enum Status {
    OPEN = "OPEN",
    PAID = "PAID",
    CANCELLED = "CANCELLED",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    acquisitionId: string;
    creditCardId?: string;
    createdByUserId: string;
    updatedByUserId: string;
    description: string;
    paymentMethod: string;
    installmentNumber: number;
    installmentCount: number;
    amount: number;
    dueAt: Date;
    status: Status;
    paidAt?: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
