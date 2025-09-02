// src/main/functions/recurring/materializeDaily.ts
import "reflect-metadata";
import { ScheduledEvent } from "aws-lambda";
import { Registry } from "@kernel/di/Registry";
import { RecurringTransactionRepository } from "@infra/database/neon/repositories/RecurringTransactionRepository";
import { RecurringMaterializer } from "@application/services/RecurringMaterializer";

const HORIZON_DAYS = Number(process.env.RECURRENCE_HORIZON_DAYS ?? "90");

export const handler = async (_event: ScheduledEvent) => {
  console.log(
    JSON.stringify({
      msg: "recurringMaterializeDaily.start",
      at: new Date().toISOString(),
    })
  );

  // materializeDaily.ts
  console.log(
    JSON.stringify({
      msg: "recurringMaterializeDaily.start",
      horizonDays: HORIZON_DAYS,
      now: new Date().toISOString(),
    })
  );
  const registry = Registry.getInstance();

  // DI — certifique-se que estes @Injectable estão registrados/visíveis:
  const repo = registry.resolve(RecurringTransactionRepository);
  const materializer = registry.resolve(RecurringMaterializer);

  const today = new Date();
  const horizon = new Date(Date.now() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

  // Busca regras que intersectam [hoje..horizonte]
  const rules = await repo.listIntersecting(today, horizon);

  for (const rule of rules) {
    // depois de materializar cada regra
    console.log(
      JSON.stringify({
        msg: "recurringMaterializeDaily.ruleDone",
        ruleId: rule.id,
        entityId: rule.entityId,
        userId: rule.userId,
      })
    );
    await materializer.materializeWithin(rule, today, horizon);
  }

  console.log(
    JSON.stringify({
      msg: "recurringMaterializeDaily.done",
      processed: rules.length,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: rules.length }),
  };
};
