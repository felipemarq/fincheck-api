export class CreditCard {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly accountId?: string;
  readonly name: string;
  readonly color: string;
  readonly creditLimit: number;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: CreditCard.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.accountId = attr.accountId;
    this.name = attr.name;
    this.color = attr.color ?? "#868E96";
    this.creditLimit = attr.creditLimit ?? 0;
    this.closingDay = attr.closingDay;
    this.dueDay = attr.dueDay;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
  }
}

export namespace CreditCard {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    accountId?: string;
    name: string;
    color?: string;
    creditLimit?: number;
    closingDay: number;
    dueDay: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
