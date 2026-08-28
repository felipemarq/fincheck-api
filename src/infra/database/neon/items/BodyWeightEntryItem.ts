import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import type { BodyWeightEntryRow } from "../schema";

export class BodyWeightEntryItem {
  static fromRow(row: BodyWeightEntryRow): BodyWeightEntry {
    return new BodyWeightEntry({
      id: row.id,
      userId: row.userId,
      measuredOn: row.measuredOn,
      weightGrams: row.weightGrams,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
