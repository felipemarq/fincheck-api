import { Account } from "@application/entities/Account";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, eq, sql } from "drizzle-orm";

import { DatabaseService } from "..";
import { AccountItem } from "../items/AccountItem";
import {
  accountsTable,
  creditCardsTable,
  installmentPurchasesTable,
  recurringTransactionsTable,
  transactionsTable,
} from "../schema";

@Injectable()
export class AccountRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(account: Account): Promise<Account> {
    const rowToInsert = AccountItem.toRow(account);

    const [created] = await this.databaseService.db
      .insert(accountsTable)
      .values(rowToInsert)
      .returning();

    return AccountItem.fromRow(created);
  }

  async listAll({
    entityId,
    userId,
  }: {
    entityId: string;
    userId: string;
  }): Promise<Account[]> {
    const accounts = await this.databaseService.db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.entityId, entityId),
          eq(accountsTable.userId, userId)
        )
      )
      .orderBy(asc(accountsTable.name));

    return accounts.map((account) => AccountItem.fromRow(account));
  }

  async findOne({
    accountId,
    entityId,
    userId,
  }: {
    accountId: string;
    entityId: string;
    userId: string;
  }): Promise<Account | null> {
    const [account] = await this.databaseService.db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.id, accountId),
          eq(accountsTable.entityId, entityId),
          eq(accountsTable.userId, userId)
        )
      )
      .limit(1);

    return account ? AccountItem.fromRow(account) : null;
  }

  async update(accountId: string, account: Account): Promise<Account> {
    const rowToUpdate = {
      ...AccountItem.toRow(account),
      updatedAt: new Date(),
    };

    const [updated] = await this.databaseService.db
      .update(accountsTable)
      .set(rowToUpdate)
      .where(
        and(
          eq(accountsTable.id, accountId),
          eq(accountsTable.entityId, account.entityId),
          eq(accountsTable.userId, account.userId)
        )
      )
      .returning();

    return AccountItem.fromRow(updated);
  }

  async getUsageSummary({
    accountId,
    entityId,
    userId,
  }: {
    accountId: string;
    entityId: string;
    userId: string;
  }): Promise<{
    transactionsCount: number;
    recurringTransactionsCount: number;
    installmentPurchasesCount: number;
    creditCardsCount: number;
    total: number;
  }> {
    const [
      transactionResult,
      recurringResult,
      installmentResult,
      creditCardResult,
    ] = await Promise.all([
      this.databaseService.db
        .select({ total: sql<number>`cast(count(*) as integer)` })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.accountId, accountId),
            eq(transactionsTable.entityId, entityId),
            eq(transactionsTable.userId, userId)
          )
        ),
      this.databaseService.db
        .select({ total: sql<number>`cast(count(*) as integer)` })
        .from(recurringTransactionsTable)
        .where(
          and(
            eq(recurringTransactionsTable.accountId, accountId),
            eq(recurringTransactionsTable.entityId, entityId),
            eq(recurringTransactionsTable.userId, userId)
          )
        ),
      this.databaseService.db
        .select({ total: sql<number>`cast(count(*) as integer)` })
        .from(installmentPurchasesTable)
        .where(
          and(
            eq(installmentPurchasesTable.accountId, accountId),
            eq(installmentPurchasesTable.entityId, entityId),
            eq(installmentPurchasesTable.userId, userId)
          )
        ),
      this.databaseService.db
        .select({ total: sql<number>`cast(count(*) as integer)` })
        .from(creditCardsTable)
        .where(
          and(
            eq(creditCardsTable.accountId, accountId),
            eq(creditCardsTable.entityId, entityId),
            eq(creditCardsTable.userId, userId)
          )
        ),
    ]);

    const transactionsCount = Number(transactionResult[0]?.total ?? 0);
    const recurringTransactionsCount = Number(recurringResult[0]?.total ?? 0);
    const installmentPurchasesCount = Number(installmentResult[0]?.total ?? 0);
    const creditCardsCount = Number(creditCardResult[0]?.total ?? 0);

    return {
      transactionsCount,
      recurringTransactionsCount,
      installmentPurchasesCount,
      creditCardsCount,
      total:
        transactionsCount +
        recurringTransactionsCount +
        installmentPurchasesCount +
        creditCardsCount,
    };
  }

  async delete({
    accountId,
    entityId,
    userId,
  }: {
    accountId: string;
    entityId: string;
    userId: string;
  }): Promise<void> {
    await this.databaseService.db
      .delete(accountsTable)
      .where(
        and(
          eq(accountsTable.id, accountId),
          eq(accountsTable.entityId, entityId),
          eq(accountsTable.userId, userId)
        )
      );
  }
}
