// src/application/entities/Category.ts
import { Transaction } from "./Transaction";

export class Category {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly name: string;
  readonly icon: string;
  readonly type: Transaction.Type;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: Category.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.name = attr.name;
    this.icon = attr.icon;
    this.type = attr.type;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
  }
}

export namespace Category {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    name: string;
    icon: string;
    type: Transaction.Type;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
