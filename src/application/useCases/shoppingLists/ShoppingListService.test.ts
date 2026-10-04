import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { shoppingItemFields, purchaseShoppingItemSchema } from "@application/controllers/shoppingLists/shoppingListSchemas";
import { shoppingListTestFixture } from "./shoppingListTestFixture";

test("listas de compras: persistência, isolamento, permissões e compra atômica", async t => {
  const f = await shoppingListTestFixture();
  t.after(() => f.pg.close());
  const add = async (patch = {}) => {
    await f.repository.addItems(f.entityId, f.list.id, f.userId, [shoppingItemFields.parse({ url: "https://loja.com.br/luvas", ...patch })]);
    return (await f.repository.listItems(f.entityId, f.list.id)).at(-1)!;
  };
  const input = (version: number, patch = {}) => purchaseShoppingItemSchema.parse({ version, purchase: {
    buyerName: "Pessoa teste", purchasedAt: "2026-10-04T12:00:00Z", paymentMethod: "PIX",
    items: [{ productId: f.productId, acquiredQuantity: 2, costUnitPrice: 10,
      allocations: [{ purchaseOrderItemId: f.orderItemId, allocatedQuantity: 2 }] }], ...patch,
  } });

  await t.test("persiste itens só com link, identifica autor e não expõe outra organização", async () => {
    const item = await add();
    assert.equal(item.quantity, null);
    assert.equal(item.createdByName, "Pessoa teste");
    assert.deepEqual(await f.repository.list(f.otherEntityId), []);
    assert.equal(await f.repository.findItem(f.otherEntityId, f.list.id, item.id), null);
    assert.equal(await f.repository.findList(f.otherEntityId, f.list.id), null);
    await assert.rejects(() => f.access.assertAccess(f.entityId, f.otherUserId, "read"));
  });
  await t.test("marca, desfaz check simples e impede edição com versão antiga", async () => {
    const item = await add();
    await f.repository.check(item, f.userId, true);
    await assert.rejects(() => f.repository.check(item, f.userId, false));
    const checked = (await f.repository.findItem(f.entityId, f.list.id, item.id))!;
    assert.equal(checked.purchasedByUserId, f.userId);
    await f.repository.check(checked, f.userId, false);
    assert.equal((await f.repository.findItem(f.entityId, f.list.id, item.id))!.purchasedAt, null);
  });
  await t.test("infere produto e OC do item e rejeita vínculos de outra organização", async () => {
    const normalized = await f.service.validateLinks(f.entityId, shoppingItemFields.parse({ url: "https://loja.com", purchaseOrderItemId: f.orderItemId }));
    assert.equal(normalized.productId, f.productId);
    assert.equal(normalized.purchaseOrderId, f.orderId);
    await assert.rejects(() => f.service.validateLinks(f.otherEntityId, normalized));
    await assert.rejects(() => f.service.validateLinks(f.entityId, { ...normalized, productId: randomUUID() }));
  });
  await t.test("grava compra, destinação, pagamento e check juntos; repetição não duplica", async () => {
    const item = await add({ productId: f.productId, purchaseOrderId: f.orderId, purchaseOrderItemId: f.orderItemId });
    const acquisition = await f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version));
    assert.equal(acquisition.totalCost, 20);
    const checked = (await f.repository.findItem(f.entityId, f.list.id, item.id))!;
    assert.equal(checked.acquisitionId, acquisition.id);
    assert.ok(checked.purchasedAt);
    const repeated = await f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version));
    assert.equal(repeated.id, acquisition.id);
    const payments = await f.pg.query<{ amount: string; status: string }>("select amount,status from payables where acquisition_id=$1", [acquisition.id]);
    assert.equal(payments.rows.length, 1);
    assert.equal(Number(payments.rows[0].amount), 20);
    assert.equal(payments.rows[0].status, "PAID");
    assert.equal(acquisition.items[0].allocations[0].purchaseOrderItemId, f.orderItemId);
    await assert.rejects(() => f.service.requireItem(f.entityId, f.list.id, item.id, checked.version));
  });
  await t.test("cria compra avulsa de um link sem exigir OC", async () => {
    const item = await add();
    const purchase = await f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version, { items: [{ productId: f.productId, acquiredQuantity: 1, costUnitPrice: 7.5 }] }));
    assert.equal(purchase.items[0].allocations.length, 0);
    assert.equal(purchase.totalCost, 7.5);
  });
  await t.test("não perde a OC quando somente o cabeçalho foi informado na lista", async () => {
    const item = await add({ purchaseOrderId: f.orderId });
    await assert.rejects(() => f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version, { items: [{ productId: f.productId, acquiredQuantity: 1, costUnitPrice: 10 }] })));
    assert.equal((await f.repository.findItem(f.entityId, f.list.id, item.id))!.acquisitionId, null);
  });
  await t.test("preserva todos os centavos e vencimentos de uma compra parcelada", async () => {
    const cardId = randomUUID();
    await f.pg.query("insert into credit_cards(id,entity_id,created_by_user_id,updated_by_user_id,name,brand,bank,last_four,holder_name,closing_day,due_day) values ($1,$2,$3,$3,'Cartão teste','VISA','Banco teste','1234','Pessoa teste',5,10)", [cardId, f.entityId, f.userId]);
    const item = await add();
    const purchase = await f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version, {
      paymentMethod: "CREDIT_CARD", creditCardId: cardId, installmentCount: 3, firstPaymentDueAt: "2026-10-10T12:00:00Z",
      items: [{ productId: f.productId, acquiredQuantity: 1, costUnitPrice: 100 }],
    }));
    const payments = await f.pg.query<{ amount: string; due_at: Date; status: string }>("select amount,due_at,status from payables where acquisition_id=$1 order by installment_number", [purchase.id]);
    assert.deepEqual(payments.rows.map(row => Number(row.amount)), [33.34, 33.33, 33.33]);
    assert.deepEqual(payments.rows.map(row => row.due_at.toISOString().slice(0,10)), ["2026-10-10", "2026-11-10", "2026-12-10"]);
    assert.ok(payments.rows.every(row => row.status === "OPEN"));
  });
  await t.test("falha em uma parcela reverte compra e check", async () => {
    const item = await add();
    await f.pg.exec("create function fail_test_payment() returns trigger language plpgsql as $$ begin if new.description = 'Compra em Falha teste' then raise exception 'simulated failure'; end if; return new; end $$; create trigger fail_test_payment before insert on payables for each row execute function fail_test_payment();");
    await assert.rejects(() => f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version, { sellerName: "Falha teste" })));
    const unchanged = (await f.repository.findItem(f.entityId, f.list.id, item.id))!;
    assert.equal(unchanged.acquisitionId, null);
    assert.equal(unchanged.purchasedAt, null);
    assert.equal(unchanged.version, item.version);
    assert.equal((await f.pg.query("select id from acquisitions where seller_name='Falha teste'")).rows.length, 0);
  });
  await t.test("duas compras concorrentes do mesmo item criam somente um pedido", async () => {
    const item = await add();
    const before = (await f.pg.query("select id from acquisitions")).rows.length;
    const results = await Promise.allSettled([f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version)), f.service.purchase(f.entityId, f.list.id, item.id, f.userId, input(item.version))]);
    assert.ok(results.some(result => result.status === "fulfilled"));
    assert.equal((await f.pg.query("select id from acquisitions")).rows.length - before, 1);
  });
  await t.test("lista arquivada preserva dados e impede alterar os itens", async () => {
    await f.repository.updateList(f.entityId, f.list.id, f.userId, { archived: true });
    await assert.rejects(() => f.service.requireList(f.entityId, f.list.id, true));
    assert.ok((await f.repository.listItems(f.entityId, f.list.id)).length);
    await f.repository.updateList(f.entityId, f.list.id, f.userId, { archived: false });
  });
  await t.test("comercial prepara listas, operações compra e usuário suspenso não acessa", async () => {
    await f.pg.exec("create table entity_memberships(id uuid default gen_random_uuid(), entity_id uuid, user_id uuid, role varchar, status varchar);");
    await f.pg.query("insert into entity_memberships(entity_id,user_id,role,status) values ($1,$2,'COMMERCIAL','ACTIVE')", [f.entityId, f.otherUserId]);
    await f.access.assertAccess(f.entityId, f.otherUserId, "read");
    await f.access.assertAccess(f.entityId, f.otherUserId, "edit");
    await assert.rejects(() => f.access.assertAccess(f.entityId, f.otherUserId, "purchase"));
    await f.pg.query("update entity_memberships set role='OPERATIONS' where user_id=$1", [f.otherUserId]);
    await f.access.assertAccess(f.entityId, f.otherUserId, "purchase");
    await f.pg.query("update entity_memberships set status='SUSPENDED' where user_id=$1", [f.otherUserId]);
    await assert.rejects(() => f.access.assertAccess(f.entityId, f.otherUserId, "read"));
  });
});
