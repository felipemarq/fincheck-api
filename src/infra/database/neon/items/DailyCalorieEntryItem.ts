import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import type { DailyCalorieEntryRow } from "../schema";

export class DailyCalorieEntryItem {
  static fromRow(row: DailyCalorieEntryRow): DailyCalorieEntry {
    return new DailyCalorieEntry({
      id: row.id,
      userId: row.userId,
      loggedOn: row.loggedOn,
      caloriesConsumed: row.caloriesConsumed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
