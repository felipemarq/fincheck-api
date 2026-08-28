import { PersonalFeature } from "@application/entities/PersonalFeature";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "..";
import { userFeaturesTable } from "../schema";

@Injectable()
export class UserFeatureRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listForUser(userId: string): Promise<PersonalFeature[]> {
    const rows = await this.databaseService.db
      .select({ feature: userFeaturesTable.feature })
      .from(userFeaturesTable)
      .where(eq(userFeaturesTable.userId, userId));

    return rows.map((row) => row.feature as PersonalFeature);
  }

  async hasFeature(userId: string, feature: PersonalFeature): Promise<boolean> {
    const [row] = await this.databaseService.db
      .select({ userId: userFeaturesTable.userId })
      .from(userFeaturesTable)
      .where(
        and(
          eq(userFeaturesTable.userId, userId),
          eq(userFeaturesTable.feature, feature)
        )
      )
      .limit(1);

    return Boolean(row);
  }
}
