import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { usersTable } from "../schema";
import { User } from "@application/entities/User";
import { eq } from "drizzle-orm";

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(user: User) {
    const { name, email } = user;
    const [userCreated] = await this.databaseService.db
      .insert(usersTable)
      .values({ name, email })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
      });

    return userCreated;
  }

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return null;
    }
    return new User({ ...user, externalId: user?.externalId ?? undefined });
  }

  async setExternalId(externalId: string, userId: string) {
    const user = await this.databaseService.db
      .update(usersTable)
      .set({
        externalId: externalId,
      })
      .where(eq(usersTable.id, userId))
      .returning();
  }

  async delete(userId: string) {
    await this.databaseService.db
      .delete(usersTable)
      .where(eq(usersTable.id, userId));
  }
}
