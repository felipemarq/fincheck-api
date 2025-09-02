import { Transaction } from "./Transaction";

export class RecurringTransaction {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly accountId: string;
  readonly categoryId: string;
  readonly creditCardId?: string;
  readonly name: string;
  readonly value: number;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly recurrence: RecurringTransaction.Recurrence;
  readonly type: Transaction.Type;
  readonly notes?: string;
  readonly seriesKey?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly contactId?: string;

  constructor(attr: RecurringTransaction.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.accountId = attr.accountId;
    this.categoryId = attr.categoryId;
    this.creditCardId = attr.creditCardId;
    this.name = attr.name;
    this.type = attr.type;
    this.value = attr.value;
    this.startDate = attr.startDate;
    this.endDate = attr.endDate;
    this.recurrence = attr.recurrence;
    this.creditCardId = attr.creditCardId;
    this.notes = attr.notes;
    this.seriesKey = attr.seriesKey;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
    this.contactId = attr.contactId;
  }
}

export namespace RecurringTransaction {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    accountId: string;
    categoryId: string;
    creditCardId?: string;
    name: string;
    value: number;
    startDate: Date;
    endDate?: Date;
    recurrence: RecurringTransaction.Recurrence;
    type: Transaction.Type;
    notes?: string;
    seriesKey?: string;
    createdAt?: Date;
    updatedAt?: Date;
    contactId?: string;
  };

  export enum Recurrence {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY",
  }
}

/*  export const recurringTransactionsTable = pgTable(
  "recurring_transactions",
  {
  
  
);*/
