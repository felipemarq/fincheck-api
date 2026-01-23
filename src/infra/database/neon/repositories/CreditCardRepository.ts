import { CreditCard } from "@application/entities/CreditCard";
import { DatabaseService } from "..";
import { creditCardsTable } from "../schema";

import { Injectable } from "@kernel/decorators/Injectable";
import { and, eq, inArray } from "drizzle-orm";
import { CreditCardItem } from "../items/CreditCardItem";
import { ListCreditCardsQuery } from "@application/controllers/creditCards/schemas/listCreditCardsQuerySchema";

@Injectable()
export class CreditCardRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Cria e retorna a entidade criada */
  async create(card: CreditCard): Promise<CreditCard> {
    const rowToInsert = CreditCardItem.toRow(card);

    const [created] = await this.databaseService.db
      .insert(creditCardsTable)
      .values(rowToInsert)
      .returning();

    return CreditCardItem.fromRow(created);
  }

  /** Lista todos os cartões de uma entidade/usuário */
  async listAll({
    filters,
    userId,
  }: {
    filters: ListCreditCardsQuery;
    userId: string;
  }): Promise<CreditCard[]> {
    const whereClause = [
      eq(creditCardsTable.entityId, filters.entityId),
      eq(creditCardsTable.userId, userId),
    ];
    if (filters.accountId?.length) {
      whereClause.push(inArray(creditCardsTable.accountId, filters.accountId));
    }

    const whereExpr = and(...whereClause);

    const cards = await this.databaseService.db
      .select()
      .from(creditCardsTable)
      .where(whereExpr);

    return cards.map((row) => CreditCardItem.fromRow(row));
  }

  async update(
    creditCardId: string,
    creditCard: CreditCard
  ): Promise<CreditCard> {
    const row = CreditCardItem.toRow(creditCard);
    const rowToInsert = { ...row, updatedAt: new Date() };
    const [updated] = await this.databaseService.db
      .update(creditCardsTable)
      .set(rowToInsert)
      .where(eq(creditCardsTable.id, creditCardId))
      .returning();
    return CreditCardItem.fromRow(updated);
  }

  async findOne({
    creditCardId,
    entityId,
    userId,
  }: {
    creditCardId: string;
    entityId: string;
    userId: string;
  }): Promise<CreditCard | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(creditCardsTable)
      .where(
        and(
          eq(creditCardsTable.id, creditCardId),
          eq(creditCardsTable.entityId, entityId),
          eq(creditCardsTable.userId, userId)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return CreditCardItem.fromRow(row);
  }
}
