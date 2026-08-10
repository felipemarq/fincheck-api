import { CreditCard } from "@application/entities/CreditCard";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, desc, eq } from "drizzle-orm";
import { DatabaseService } from "..";
import { CreditCardItem } from "../items/CreditCardItem";
import { creditCardsTable } from "../schema";

@Injectable()
export class CreditCardRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(card: CreditCard): Promise<CreditCard> {
    const [row] = await this.databaseService.db
      .insert(creditCardsTable)
      .values(CreditCardItem.toRow(card))
      .returning();
    return CreditCardItem.fromRow(row);
  }

  async listAll({
    entityId,
    active,
  }: {
    entityId: string;
    active?: boolean;
  }): Promise<CreditCard[]> {
    const conditions = [eq(creditCardsTable.entityId, entityId)];
    if (active !== undefined) {
      conditions.push(eq(creditCardsTable.active, active));
    }

    const rows = await this.databaseService.db
      .select()
      .from(creditCardsTable)
      .where(and(...conditions))
      .orderBy(desc(creditCardsTable.active), asc(creditCardsTable.name));
    return rows.map(CreditCardItem.fromRow);
  }

  async findOne({
    entityId,
    creditCardId,
  }: {
    entityId: string;
    creditCardId: string;
  }): Promise<CreditCard | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(creditCardsTable)
      .where(
        and(
          eq(creditCardsTable.id, creditCardId),
          eq(creditCardsTable.entityId, entityId)
        )
      )
      .limit(1);
    return row ? CreditCardItem.fromRow(row) : null;
  }

  async findDuplicate({
    entityId,
    bank,
    lastFour,
  }: {
    entityId: string;
    bank: string;
    lastFour: string;
  }): Promise<CreditCard | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(creditCardsTable)
      .where(
        and(
          eq(creditCardsTable.entityId, entityId),
          eq(creditCardsTable.bank, bank),
          eq(creditCardsTable.lastFour, lastFour)
        )
      )
      .limit(1);
    return row ? CreditCardItem.fromRow(row) : null;
  }

  async update(card: CreditCard): Promise<CreditCard> {
    const { id: _id, createdByUserId: _createdByUserId, ...values } =
      CreditCardItem.toRow(card);
    const [row] = await this.databaseService.db
      .update(creditCardsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(creditCardsTable.id, card.id!),
          eq(creditCardsTable.entityId, card.entityId)
        )
      )
      .returning();
    return CreditCardItem.fromRow(row);
  }
}
