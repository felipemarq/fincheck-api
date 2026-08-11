import "reflect-metadata";

import assert from "node:assert/strict";
import test from "node:test";

import { PurchaseOrder } from "@application/entities/PurchaseOrder";
import { GetOperationsDashboardUseCase } from "./GetOperationsDashboardUseCase";

test("consulta somente ordens ativas emitidas no periodo inclusivo", async () => {
  let repositoryInput: Record<string, unknown> | undefined;
  const useCase = new GetOperationsDashboardUseCase(
    {
      listAll: async (input: Record<string, unknown>) => {
        repositoryInput = input;
        return [];
      },
    } as never,
    { listAllForEntity: async () => [] } as never,
    { assertUserAccess: async () => undefined } as never
  );

  const result = await useCase.execute({
    entityId: "entity-1",
    userId: "user-1",
    issuedFrom: new Date("2026-07-11T00:00:00.000Z"),
    issuedTo: new Date("2026-08-09T00:00:00.000Z"),
  });

  assert.deepEqual(repositoryInput, {
    entityId: "entity-1",
    lifecycleStatus: PurchaseOrder.LifecycleStatus.ACTIVE,
    issuedFrom: new Date("2026-07-11T00:00:00.000Z"),
    issuedBefore: new Date("2026-08-10T00:00:00.000Z"),
  });
  assert.equal(result.operational.activeOrders, 0);
});
