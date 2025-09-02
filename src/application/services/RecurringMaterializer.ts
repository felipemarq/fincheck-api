// src/application/services/RecurringMaterializer.ts
import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "@infra/database/neon";
import { transactionsTable } from "@infra/database/neon/schema";
import { RecurringEngine } from "./RecurringEngine";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class RecurringMaterializer {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Gera transações normais para a recorrência dentro de [from..to],
   * usando seriesKey para idempotência.
   */
  async materializeWithin(
    rule: RecurringTransaction,
    from: Date,
    to: Date
  ): Promise<void> {
    for (const occ of RecurringEngine.occurrences(
      {
        recurrence: rule.recurrence,
        startDate: rule.startDate,
        endDate: rule.endDate,
      },
      from,
      to
    )) {
      const key = `${rule.id}:${ymd(occ)}`;

      console.log(
        JSON.stringify({
          msg: "recurring.materializeWithin",
          ruleId: rule.id,
          from: from.toISOString(),
          to: to.toISOString(),
        })
      );

      await this.database.db
        .insert(transactionsTable)
        .values({
          entityId: rule.entityId,
          userId: rule.userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          creditCardId: rule.creditCardId ?? null,
          contactId: rule.contactId ?? null,

          name: rule.name,
          value: (Math.round(rule.value * 100) / 100).toFixed(2), // NUMERIC(string)
          date: occ,
          dueDate: null,
          type: rule.type,
          isPaid: false, // futuros como não pagos
          notes: rule.notes ?? null,

          seriesKey: key,
        })
        .onConflictDoNothing({ target: [transactionsTable.seriesKey] });
    }
  }
}
