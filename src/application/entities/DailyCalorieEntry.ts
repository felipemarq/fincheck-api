export class DailyCalorieEntry {
  readonly id: string;
  readonly userId: string;
  readonly loggedOn: string;
  readonly caloriesConsumed: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(attributes: DailyCalorieEntry.Attributes) {
    this.id = attributes.id;
    this.userId = attributes.userId;
    this.loggedOn = attributes.loggedOn;
    this.caloriesConsumed = attributes.caloriesConsumed;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }
}

export namespace DailyCalorieEntry {
  export type Attributes = {
    id: string;
    userId: string;
    loggedOn: string;
    caloriesConsumed: number;
    createdAt: Date;
    updatedAt: Date;
  };
}
