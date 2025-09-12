// src/application/entities/TaxRate.ts
export class TaxRate {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly year: number; // ex.: 2025
  readonly month: number; // 1..12
  readonly ratePercent: number; // ex.: 6.00 (em %)
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: TaxRate.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.year = attr.year;
    this.month = attr.month;
    this.ratePercent = attr.ratePercent;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;

    // (opcional) validações leves no domínio
    if (this.month < 1 || this.month > 12) {
      throw new Error("month deve estar entre 1 e 12.");
    }
    if (this.ratePercent < 0 || this.ratePercent > 100) {
      throw new Error("ratePercent deve estar entre 0 e 100.");
    }
  }
}

export namespace TaxRate {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    year: number;
    month: number; // 1..12
    ratePercent: number; // 0..100
    createdAt?: Date;
    updatedAt?: Date;
  };
}
