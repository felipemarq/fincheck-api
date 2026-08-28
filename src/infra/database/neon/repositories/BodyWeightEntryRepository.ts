import { BodyWeightEntry } from "@application/entities/BodyWeightEntry";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { DatabaseService } from "..";
import { BodyWeightEntryItem } from "../items/BodyWeightEntryItem";
import { bodyWeightEntriesTable } from "../schema";

@Injectable()
export class BodyWeightEntryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async list({
    userId,
    from,
    to,
  }: BodyWeightEntryRepository.ListInput): Promise<BodyWeightEntry[]> {
    const conditions = [eq(bodyWeightEntriesTable.userId, userId)];

    if (from) {
      conditions.push(gte(bodyWeightEntriesTable.measuredOn, from));
    }

    if (to) {
      conditions.push(lte(bodyWeightEntriesTable.measuredOn, to));
    }

    const rows = await this.databaseService.db
      .select()
      .from(bodyWeightEntriesTable)
      .where(and(...conditions))
      .orderBy(asc(bodyWeightEntriesTable.measuredOn));

    return rows.map(BodyWeightEntryItem.fromRow);
  }

  async upsert({
    userId,
    measuredOn,
    weightGrams,
  }: BodyWeightEntryRepository.UpsertInput): Promise<BodyWeightEntry> {
    const [row] = await this.databaseService.db
      .insert(bodyWeightEntriesTable)
      .values({ userId, measuredOn, weightGrams })
      .onConflictDoUpdate({
        target: [
          bodyWeightEntriesTable.userId,
          bodyWeightEntriesTable.measuredOn,
        ],
        set: { weightGrams, updatedAt: new Date() },
      })
      .returning();

    return BodyWeightEntryItem.fromRow(row);
  }

  async delete({
    userId,
    measuredOn,
  }: BodyWeightEntryRepository.DeleteInput): Promise<void> {
    await this.databaseService.db
      .delete(bodyWeightEntriesTable)
      .where(
        and(
          eq(bodyWeightEntriesTable.userId, userId),
          eq(bodyWeightEntriesTable.measuredOn, measuredOn)
        )
      );
  }
}

export namespace BodyWeightEntryRepository {
  export type ListInput = {
    userId: string;
    from?: string;
    to?: string;
  };

  export type UpsertInput = {
    userId: string;
    measuredOn: string;
    weightGrams: number;
  };

  export type DeleteInput = {
    userId: string;
    measuredOn: string;
  };
}
