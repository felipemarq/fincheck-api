import { ListTransactionQuery } from "@application/controllers/transactions/schemas/listTransactionQuerySchema";
import { Entity } from "@application/entities/Entity";
import { Transaction } from "@application/entities/Transaction";
import { User } from "@application/entities/User";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { DatabaseService } from "@infra/database/neon";
import { UserRepository } from "@infra/database/neon/repositories/UserRepository";
import { entitiesTable, usersTable } from "@infra/database/neon/schema";
import { Injectable } from "@kernel/decorators/Injectable";
import { asc, eq } from "drizzle-orm";

@Injectable()
export class GetMeQuery {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute(getMeQueryInput: GetMeQuery.Input): Promise<GetMeQuery.Output> {
    const rows = await this.databaseService.db
      .select()
      .from(usersTable)
      .leftJoin(entitiesTable, eq(usersTable.id, entitiesTable.ownerUserId))
      .where(eq(usersTable.id, getMeQueryInput.userId))
      .orderBy(asc(entitiesTable.createdAt), asc(entitiesTable.name));

    if (rows.length === 0) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para acessar suas informações."
      );
    }
    const userRow = rows[0].users;
    const user = new User({
      ...userRow,
      externalId: userRow?.externalId ?? undefined,
    });

    const entities = rows
      .filter((r) => r.entities) // remove linhas sem entidade (LEFT JOIN)
      .map(
        (r) =>
          new Entity({
            name: r.entities!.name,
            type: r.entities!.type as Entity.Type,
            color: r.entities!.color,
            ownerUserId: r.entities!.ownerUserId,
            id: r.entities!.id,
            createdAt: r.entities!.createdAt,
            updatedAt: r.entities!.updatedAt,
          })
      ); // uma entidade por linha

    return { user, entities };
  }
}

export namespace GetMeQuery {
  export type Input = { userId: string };
  export type Output = {
    user: User;
    entities: Entity[];
  };
}
