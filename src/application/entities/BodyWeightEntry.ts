export class BodyWeightEntry {
  readonly id: string;
  readonly userId: string;
  readonly measuredOn: string;
  readonly weightGrams: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(attributes: BodyWeightEntry.Attributes) {
    this.id = attributes.id;
    this.userId = attributes.userId;
    this.measuredOn = attributes.measuredOn;
    this.weightGrams = attributes.weightGrams;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  get weightKg(): number {
    return this.weightGrams / 1_000;
  }
}

export namespace BodyWeightEntry {
  export type Attributes = {
    id: string;
    userId: string;
    measuredOn: string;
    weightGrams: number;
    createdAt: Date;
    updatedAt: Date;
  };
}
