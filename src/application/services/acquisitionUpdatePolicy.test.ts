import assert from "node:assert/strict";
import test from "node:test";
import { Acquisition } from "@application/entities/Acquisition";
import { acquisitionUpdateAffectsPayables } from "./acquisitionUpdatePolicy";

test("permite corrigir dados descritivos sem recriar parcelas", () => {
  assert.equal(
    acquisitionUpdateAffectsPayables(
      {
        purchasedAt: new Date("2026-08-02T12:00:00.000Z"),
        status: Acquisition.Status.IN_TRANSIT,
      },
      Acquisition.PaymentMethod.CREDIT_CARD
    ),
    false
  );
  assert.equal(
    acquisitionUpdateAffectsPayables(
      {},
      Acquisition.PaymentMethod.BOLETO
    ),
    false
  );
});

test("identifica alteracoes que exigem recriar parcelas", () => {
  const paymentMethod = Acquisition.PaymentMethod.CREDIT_CARD;

  assert.equal(
    acquisitionUpdateAffectsPayables({ shippingCost: 20 }, paymentMethod),
    true
  );
  assert.equal(
    acquisitionUpdateAffectsPayables({ items: [] }, paymentMethod),
    true
  );
  assert.equal(
    acquisitionUpdateAffectsPayables(
      { firstPaymentDueAt: new Date("2026-09-10T12:00:00.000Z") },
      paymentMethod
    ),
    true
  );
  assert.equal(
    acquisitionUpdateAffectsPayables(
      { status: Acquisition.Status.CANCELLED },
      paymentMethod
    ),
    true
  );
});

test("a data da compra altera apenas pagamentos imediatos", () => {
  const update = { purchasedAt: new Date("2026-08-02T12:00:00.000Z") };

  assert.equal(
    acquisitionUpdateAffectsPayables(
      update,
      Acquisition.PaymentMethod.PIX
    ),
    true
  );
  assert.equal(
    acquisitionUpdateAffectsPayables(
      update,
      Acquisition.PaymentMethod.BOLETO
    ),
    false
  );
});
