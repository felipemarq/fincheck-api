import { DailyCalorieEntry } from "@application/entities/DailyCalorieEntry";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { DatabaseService } from "..";
import { DailyCalorieEntryItem } from "../items/DailyCalorieEntryItem";
import { dailyCalorieEntriesTable } from "../schema";

@Injectable()
export class DailyCalorieEntryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async list({
    userId,
    from,
    to,
  }: DailyCalorieEntryRepository.ListInput): Promise<DailyCalorieEntry[]> {
    const conditions = [eq(dailyCalorieEntriesTable.userId, userId)];

    if (from) conditions.push(gte(dailyCalorieEntriesTable.loggedOn, from));
    if (to) conditions.push(lte(dailyCalorieEntriesTable.loggedOn, to));

    const rows = await this.databaseService.db
      .select()
      .from(dailyCalorieEntriesTable)
      .where(and(...conditions))
      .orderBy(asc(dailyCalorieEntriesTable.loggedOn));

    return rows.map(DailyCalorieEntryItem.fromRow);
  }

  async upsert({
    userId,
    loggedOn,
    caloriesConsumed,
  }: DailyCalorieEntryRepository.UpsertInput): Promise<DailyCalorieEntry> {
    const [row] = await this.databaseService.db
      .insert(dailyCalorieEntriesTable)
      .values({ userId, loggedOn, caloriesConsumed })
      .onConflictDoUpdate({
        target: [
          dailyCalorieEntriesTable.userId,
          dailyCalorieEntriesTable.loggedOn,
        ],
        set: { caloriesConsumed, updatedAt: new Date() },
      })
      .returning();

    return DailyCalorieEntryItem.fromRow(row);
  }

  async delete({
    userId,
    loggedOn,
  }: DailyCalorieEntryRepository.DeleteInput): Promise<void> {
    await this.databaseService.db
      .delete(dailyCalorieEntriesTable)
      .where(
        and(
          eq(dailyCalorieEntriesTable.userId, userId),
          eq(dailyCalorieEntriesTable.loggedOn, loggedOn)
        )
      );
  }
}

export namespace DailyCalorieEntryRepository {
  export type ListInput = {
    userId: string;
    from?: string;
    to?: string;
  };

  export type UpsertInput = {
    userId: string;
    loggedOn: string;
    caloriesConsumed: number;
  };

  export type DeleteInput = {
    userId: string;
    loggedOn: string;
  };
}
