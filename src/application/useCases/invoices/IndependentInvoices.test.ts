import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { Invoice, ReceivablePayment } from "@application/entities/Invoice";
import { CreateInvoiceController } from "@application/controllers/invoices/CreateInvoiceController";
import { UpdateInvoiceController } from "@application/controllers/invoices/UpdateInvoiceController";
import { CreateReceivablePaymentController } from "@application/controllers/invoices/CreateReceivablePaymentController";
import { invoiceTestFixture } from "./invoiceTestFixture";

test("notas independentes: migração, HTTP, persistência, recebimentos e indicadores", async (t) => {
  const f = await invoiceTestFixture();
  t.after(() => f.pg.close());
  const context = { entityId: f.entityId, userId: f.userId };
  const input = (invoiceNumber: string, patch = {}) => ({
    ...context,
    customerId: f.customerId,
    invoiceNumber,
    issuedAt: new Date("2026-11-02T12:00:00Z"),
    dueAt: new Date("2026-12-02T12:00:00Z"),
    status: Invoice.Status.ISSUED,
    otherDeductions: 0.86,
    taxAmount: 1.5,
    items: [
      {
        description: "Dreno cirúrgico",
        originalUnit: "UN",
        invoicedQuantity: 2.5,
        unitPrice: 12.345678,
      },
    ],
    ...patch,
  });
  const listInput = {
    ...context,
    status: "ALL" as const,
    sort: "URGENCY" as const,
    page: 1,
    pageSize: 20,
  };
  let standaloneId: string;

  await t.test(
    "migra sem recriar notas, itens, vínculos ou pagamentos antigos",
    async () => {
      const [invoice] = await f.list.execute({
        ...context,
        purchaseOrderId: f.orderId,
      });
      assert.equal(invoice.id, f.legacyInvoiceId);
      assert.equal(invoice.customerId, f.customerId);
      assert.equal(invoice.items[0].id, f.legacyItemId);
      assert.equal(invoice.items[0].description, "Descrição fiscal original");
      assert.equal(invoice.items[0].purchaseOrderItemId, f.orderItemId);
      assert.equal(invoice.payments[0].id, f.legacyPaymentId);
      assert.equal(invoice.receivedAmount, 40);
      assert.equal(invoice.outstandingAmount, 160);
      await f.pg.query(
        "update purchase_order_items set description='Descrição da OC alterada' where id=$1",
        [f.orderItemId],
      );
      const listed = await f.list.execute(context);
      assert.equal(listed[0].items[0].description, "Descrição fiscal original");
    },
  );
  await t.test(
    "cadastro HTTP sem OC conserva decimais e dados próprios",
    async () => {
      const response = await new CreateInvoiceController(f.create).execute({
        userId: f.userId,
        params: { entityId: f.entityId },
        queryParams: {},
        body: input("NF-AVULSA") as never,
      });
      const invoice = response.body!.invoice;
      standaloneId = invoice.id!;
      assert.equal(response.statusCode, 201);
      assert.equal(invoice.purchaseOrderId, undefined);
      assert.equal(invoice.customerId, f.customerId);
      assert.equal(invoice.items[0].purchaseOrderItemId, undefined);
      assert.equal(invoice.items[0].description, "Dreno cirúrgico");
      assert.equal(invoice.items[0].unitPrice, 12.345678);
      assert.equal(invoice.grossAmount, 30.86);
      assert.equal(invoice.netReceivableAmount, 30);
      const stored = await f.invoices.findOne({
        entityId: f.entityId,
        invoiceId: standaloneId,
      });
      assert.equal(stored?.grossAmount, 30.86);
      assert.equal(
        (await f.list.execute({ ...context, purchaseOrderId: f.orderId }))
          .length,
        1,
      );
    },
  );
  await t.test(
    "bloqueia número duplicado, cliente/nota de outra empresa e itens sem descrição",
    async () => {
      await assert.rejects(
        () => f.create.execute(input("NF-AVULSA")),
        /Ja existe/,
      );
      await assert.rejects(
        () =>
          f.create.execute(
            input("NF-CLIENTE-ERRADO", { customerId: f.otherCustomerId }),
          ),
        /Cliente nao encontrado/,
      );
      await assert.rejects(
        () =>
          f.create.execute(input("NF-SEM-CLIENTE", { customerId: undefined })),
        /Informe o cliente/,
      );
      await assert.rejects(
        () =>
          f.create.execute(
            input("NF-SEM-DESCRICAO", {
              items: [
                { originalUnit: "UN", invoicedQuantity: 1, unitPrice: 1 },
              ],
            }),
          ),
        /descricao/,
      );
      await assert.rejects(
        () =>
          f.create.execute(
            input("NF-ITEM-OC", {
              items: [
                {
                  purchaseOrderItemId: f.orderItemId,
                  description: "Item",
                  originalUnit: "UN",
                  invoicedQuantity: 1,
                  unitPrice: 1,
                },
              ],
            }),
          ),
        /descricao/,
      );
      await assert.rejects(
        () => f.list.execute({ entityId: f.entityId, userId: f.otherUserId }),
        /nao permite/,
      );
      assert.equal(
        await f.invoices.findOne({
          entityId: f.otherEntityId,
          invoiceId: standaloneId,
        }),
        null,
      );
      await assert.rejects(
        () =>
          f.update.execute({
            entityId: f.otherEntityId,
            userId: f.otherUserId,
            invoiceId: standaloneId,
            notes: "Invasão",
          }),
        /nao encontrada/,
      );
    },
  );
  await t.test(
    "edita uma nota sem OC pelo HTTP e não aceita IDs de itens alheios",
    async () => {
      const response = await new UpdateInvoiceController(f.update).execute({
        userId: f.userId,
        params: { entityId: f.entityId, invoiceId: standaloneId },
        queryParams: {},
        body: { notes: "Conferida", dueAt: "2026-12-03T12:00:00Z" },
      });
      assert.equal(response.body!.invoice.notes, "Conferida");
      assert.equal(
        response.body!.invoice.items[0].description,
        "Dreno cirúrgico",
      );
      await assert.rejects(
        () =>
          f.update.execute({
            ...context,
            invoiceId: standaloneId,
            items: [
              {
                id: f.legacyItemId,
                description: "Outro",
                originalUnit: "UN",
                invoicedQuantity: 1,
                unitPrice: 1,
              },
            ],
          }),
        /nao pertence/,
      );
    },
  );
  await t.test(
    "registra baixa parcial, trava valores e impede baixa acima do saldo",
    async () => {
      const response = await new CreateReceivablePaymentController(
        f.receive,
      ).execute({
        userId: f.userId,
        params: { entityId: f.entityId, invoiceId: standaloneId },
        queryParams: {},
        body: {
          receivedAt: "2026-11-03T12:00:00Z",
          amount: 10,
          paymentMethod: "PIX",
          reference: "Extrato-123",
        },
      });
      assert.equal(response.statusCode, 201);
      const stored = (await f.invoices.findOne({
        entityId: f.entityId,
        invoiceId: standaloneId,
      }))!;
      assert.equal(stored.payments[0].purchaseOrderId, undefined);
      assert.equal(stored.receivedAmount, 10);
      assert.equal(stored.outstandingAmount, 20);
      assert.equal(
        stored.receivableStatus,
        Invoice.ReceivableStatus.PARTIALLY_RECEIVED,
      );
      await assert.rejects(
        () =>
          f.update.execute({
            ...context,
            invoiceId: standaloneId,
            otherDeductions: 5,
          }),
        /apenas vencimento/,
      );
      await assert.rejects(
        () =>
          f.receive.execute({
            ...context,
            invoiceId: standaloneId,
            amount: 20.01,
            receivedAt: new Date(),
            paymentMethod: "PIX",
          }),
        /ultrapassar/,
      );
      await assert.rejects(
        () =>
          f.receive.execute({
            ...context,
            purchaseOrderId: f.orderId,
            invoiceId: standaloneId,
            amount: 1,
            receivedAt: new Date(),
            paymentMethod: "PIX",
          }),
        /nao encontrada/,
      );
      await assert.rejects(
        () =>
          f.update.execute({
            ...context,
            invoiceId: standaloneId,
            issuedAt: new Date("2020-01-01T12:00:00Z"),
          }),
        /apenas vencimento/,
      );
      const paid = await f.receive.execute({
        ...context,
        invoiceId: standaloneId,
        amount: 20,
        receivedAt: new Date(),
        paymentMethod: "TED",
      });
      assert.equal(
        (await f.invoices.findOne({
          entityId: f.entityId,
          invoiceId: standaloneId,
        }))!.receivableStatus,
        Invoice.ReceivableStatus.RECEIVED,
      );
      await f.updatePayment.execute({
        ...context,
        invoiceId: standaloneId,
        paymentId: paid.id!,
        status: ReceivablePayment.Status.CANCELLED,
      });
      assert.equal(
        (await f.invoices.findOne({
          entityId: f.entityId,
          invoiceId: standaloneId,
        }))!.outstandingAmount,
        20,
      );
    },
  );
  await t.test(
    "vencidas inclui saldo parcial e pesquisa encontra item sem OC",
    async () => {
      const late = await f.create.execute(
        input("NF-PARCIAL-VENCIDA", {
          issuedAt: new Date("2020-01-01T12:00:00Z"),
          dueAt: new Date("2020-01-02T12:00:00Z"),
        }),
      );
      await f.receive.execute({
        ...context,
        invoiceId: late.id!,
        amount: 5,
        receivedAt: new Date(),
        paymentMethod: "PIX",
      });
      const overdue = await f.receivables.execute({
        ...listInput,
        status: Invoice.ReceivableStatus.OVERDUE,
      });
      assert.ok(
        overdue.receivables.some(
          (invoice) => invoice.id === late.id && invoice.daysOverdue > 0,
        ),
      );
      const search = await f.receivables.execute({
        ...listInput,
        search: "dreno cirurgico",
      });
      assert.equal(search.pagination.total, 2);
      assert.ok(
        search.receivables.every(
          (invoice) =>
            invoice.orderNumber === undefined &&
            invoice.customerId === f.customerId,
        ),
      );
      assert.equal(
        (
          await f.receivables.execute({
            ...listInput,
            status: Invoice.ReceivableStatus.PARTIALLY_RECEIVED,
          })
        ).pagination.total,
        3,
      );
    },
  );
  await t.test(
    "painel conta notas uma única vez, inclui OC encerrada e separa o período fiscal",
    async () => {
      await f.create.execute(
        input("NF-RASCUNHO", { status: Invoice.Status.DRAFT }),
      );
      await f.create.execute(
        input("NF-CANCELADA", { status: Invoice.Status.CANCELLED }),
      );
      await f.pg.query(
        "update purchase_orders set lifecycle_status='CANCELLED' where id=$1",
        [f.orderId],
      );
      const dashboard = await f.dashboard.execute({
        ...context,
        issuedFrom: new Date("2026-11-01T00:00:00Z"),
        issuedTo: new Date("2026-11-02T00:00:00Z"),
      });
      assert.equal(dashboard.operational.activeOrders, 0);
      assert.equal(dashboard.financial.invoicedRevenue, 230.86);
      assert.equal(dashboard.financial.receivedRevenue, 50);
      assert.equal(dashboard.financial.receivableBalance, 180);
      assert.equal(dashboard.receivables.openTotal, 205);
      assert.equal(dashboard.financial.taxCost, 1.5);
      assert.equal(dashboard.financial.otherDeductions, 0.86);
    },
  );
  await t.test(
    "duplicidade simultânea falha sem deixar itens órfãos",
    async () => {
      const results = await Promise.allSettled([
        f.create.execute(input("NF-CONCORRENTE")),
        f.create.execute(input("NF-CONCORRENTE")),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const counts = await f.pg.query<{ total: number }>(
        "select count(*)::int total from invoices where invoice_number='NF-CONCORRENTE'",
      );
      assert.equal(counts.rows[0].total, 1);
    },
  );
  await t.test(
    "preserva os papéis SaaS: financeiro altera, comercial e operações consultam, suspensos não acessam",
    async () => {
      await f.pg.exec(
        "create table entity_memberships (id uuid primary key default gen_random_uuid(), entity_id uuid not null, user_id uuid not null, role text not null, status text not null default 'ACTIVE')",
      );
      for (const role of [
        "OWNER",
        "ADMIN",
        "FINANCE",
        "COMMERCIAL",
        "OPERATIONS",
        "VIEWER",
      ]) {
        const memberId = randomUUID();
        await f.pg.query("insert into users(id,name,email) values ($1,$2,$3)", [
          memberId,
          role,
          `${memberId}@example.test`,
        ]);
        await f.pg.query(
          "insert into entity_memberships(entity_id,user_id,role) values ($1,$2,$3)",
          [f.entityId, memberId, role],
        );
        await f.access.assertUserAccess(f.entityId, memberId, "invoices.read");
        await f.access.assertUserAccess(f.entityId, memberId, "dashboard.read");
        if (["OWNER", "ADMIN", "FINANCE"].includes(role)) {
          const invoice = await f.create.execute({
            ...input(`NF-PERFIL-${role}`),
            userId: memberId,
          });
          await f.receive.execute({
            ...context,
            userId: memberId,
            invoiceId: invoice.id!,
            amount: 1,
            paymentMethod: "PIX",
            receivedAt: new Date(),
          });
        } else {
          await assert.rejects(
            () =>
              f.create.execute({
                ...input(`NF-PERFIL-${role}`),
                userId: memberId,
              }),
            /nao permite/,
          );
          await assert.rejects(
            () =>
              f.access.assertUserAccess(
                f.entityId,
                memberId,
                "payments.manage",
              ),
            /nao permite/,
          );
        }
        if (role === "COMMERCIAL" || role === "OPERATIONS") {
          await assert.rejects(
            () => f.receivables.execute({ ...listInput, userId: memberId }),
            /nao permite/,
          );
        }
        await f.pg.query(
          "update entity_memberships set status='SUSPENDED' where user_id=$1",
          [memberId],
        );
        await assert.rejects(
          () => f.list.execute({ ...context, userId: memberId }),
          /nao permite/,
        );
      }
    },
  );
});
