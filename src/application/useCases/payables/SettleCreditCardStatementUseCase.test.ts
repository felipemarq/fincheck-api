import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";

import { CreditCard } from "@application/entities/CreditCard";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { SettleCreditCardStatementUseCase } from "./SettleCreditCardStatementUseCase";

const entityId = "11111111-1111-4111-8111-111111111111";
const creditCardId = "22222222-2222-4222-8222-222222222222";

test("quita somente o intervalo UTC do mes informado", async () => {
  let capturedPeriod: { dueFrom: Date; dueTo: Date } | undefined;
  const payableRepository = {
    settleCreditCardStatement: async (input: {
      dueFrom: Date;
      dueTo: Date;
    }) => {
      capturedPeriod = input;
      return { settledCount: 3, settledAmount: 450.75 };
    },
  } as unknown as PayableRepository;
  const creditCardRepository = {
    findOne: async () =>
      new CreditCard({
        id: creditCardId,
        entityId,
        createdByUserId: "user-1",
        updatedByUserId: "user-1",
        name: "Nubank",
        holderName: "Felipe",
        bank: "Nubank",
        brand: CreditCard.Brand.MASTERCARD,
        lastFour: "1234",
        closingDay: 3,
        dueDay: 10,
      }),
  } as unknown as CreditCardRepository;
  const organizationAccessService = {
    assertUserAccess: async () => undefined,
  } as unknown as OrganizationAccessService;
  const useCase = new SettleCreditCardStatementUseCase(
    payableRepository,
    creditCardRepository,
    organizationAccessService
  );

  const result = await useCase.execute({
    entityId,
    userId: "user-1",
    creditCardId,
    year: 2026,
    month: 8,
    paidAt: new Date("2026-08-09T12:00:00.000Z"),
  });

  assert.equal(capturedPeriod?.dueFrom.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(capturedPeriod?.dueTo.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(result.settledCount, 3);
  assert.equal(result.settledAmount, 450.75);
});
