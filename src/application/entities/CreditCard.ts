export class CreditCard {
  readonly id?: string;
  readonly entityId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly name: string;
  readonly holderName: string;
  readonly bank: string;
  readonly brand: CreditCard.Brand;
  readonly lastFour: string;
  readonly color: string;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly creditLimit?: number;
  readonly active: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attributes: CreditCard.Attributes) {
    this.id = attributes.id;
    this.entityId = attributes.entityId;
    this.createdByUserId = attributes.createdByUserId;
    this.updatedByUserId = attributes.updatedByUserId;
    this.name = attributes.name;
    this.holderName = attributes.holderName;
    this.bank = attributes.bank;
    this.brand = attributes.brand;
    this.lastFour = attributes.lastFour;
    this.color = attributes.color ?? "#868e96";
    this.closingDay = attributes.closingDay;
    this.dueDay = attributes.dueDay;
    this.creditLimit = attributes.creditLimit;
    this.active = attributes.active ?? true;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get safeLabel(): string {
    return `${this.name} - ${this.brand} final ${this.lastFour}`;
  }
}

export namespace CreditCard {
  export enum Brand {
    VISA = "VISA",
    MASTERCARD = "MASTERCARD",
    ELO = "ELO",
    AMEX = "AMEX",
    HIPERCARD = "HIPERCARD",
    OTHER = "OTHER",
  }

  export type Attributes = {
    id?: string;
    entityId: string;
    createdByUserId: string;
    updatedByUserId: string;
    name: string;
    holderName: string;
    bank: string;
    brand: Brand;
    lastFour: string;
    color?: string;
    closingDay: number;
    dueDay: number;
    creditLimit?: number;
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
