import { randomUUID } from "node:crypto";
import { Acquisition } from "@application/entities/Acquisition";
import { ShoppingListItem } from "@application/entities/ShoppingList";
import { ShoppingItemInput, purchaseShoppingItemSchema } from "@application/controllers/shoppingLists/shoppingListSchemas";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { AcquisitionPreparationService } from "@application/services/AcquisitionPreparationService";
import { AcquisitionViewService } from "@application/services/AcquisitionViewService";
import { PaymentConfigurationService } from "@application/services/PaymentConfigurationService";
import { validateAcquisition } from "@application/services/validateAcquisition";
import { ShoppingListAccessService } from "@application/services/ShoppingListAccessService";
import { ShoppingListRepository } from "@infra/database/neon/repositories/ShoppingListRepository";
import { PurchaseOrderRepository } from "@infra/database/neon/repositories/PurchaseOrderRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { AcquisitionRepository } from "@infra/database/neon/repositories/AcquisitionRepository";
import { Injectable } from "@kernel/decorators/Injectable";
import { z } from "zod";

@Injectable()
export class ShoppingListService {
  constructor(
    readonly repository: ShoppingListRepository,
    readonly access: ShoppingListAccessService,
    private readonly orders: PurchaseOrderRepository,
    private readonly products: ProductRepository,
    private readonly preparation: AcquisitionPreparationService,
    private readonly payment: PaymentConfigurationService,
    private readonly acquisitions: AcquisitionRepository,
    private readonly views: AcquisitionViewService,
  ) {}

  async requireList(entityId: string, listId: string, writable = false) {
    const list = await this.repository.findList(entityId, listId);
    if (!list) throw new NotFoundException("Lista de compras não encontrada.");
    if (writable && list.archived) throw new ConflictException("Reabra a lista para alterar seus itens.");
    return list;
  }
  async requireItem(entityId: string, listId: string, itemId: string, version: number, allowLinked = false) {
    await this.requireList(entityId, listId, true);
    const item = await this.repository.findItem(entityId, listId, itemId);
    if (!item) throw new NotFoundException("Item não encontrado nesta lista.");
    if (item.acquisitionId && !allowLinked) throw new ConflictException("Este item possui um pedido ao fornecedor. Corrija a compra no pedido vinculado.");
    if (item.version !== version && !(allowLinked && item.acquisitionId)) throw new ConflictException("Este item foi alterado por outra pessoa. Atualize a lista e tente novamente.");
    return item;
  }

  async validateLinks(entityId: string, input: ShoppingItemInput): Promise<ShoppingItemInput> {
    const result = { ...input };
    if (input.purchaseOrderItemId) {
      const [context] = await this.orders.findItemContexts({ entityId, purchaseOrderItemIds: [input.purchaseOrderItemId] });
      if (!context || (input.purchaseOrderId && input.purchaseOrderId !== context.purchaseOrderId) || (input.productId && input.productId !== context.item.productId)) {
        throw new BadRequestException("O item, o produto e a OC devem pertencer à mesma organização e corresponder entre si.");
      }
      result.purchaseOrderId = context.purchaseOrderId;
      result.productId = context.item.productId;
    } else if (input.purchaseOrderId) {
      const order = await this.orders.findOne({ entityId, purchaseOrderId: input.purchaseOrderId });
      if (!order) throw new BadRequestException("A OC não pertence à organização.");
    }
    if (result.productId) {
      const product = await this.products.findOne({ entityId, productId: result.productId });
      if (!product) throw new BadRequestException("O produto não pertence à organização.");
    }
    return result;
  }

  async purchase(entityId: string, listId: string, itemId: string, userId: string, input: z.infer<typeof purchaseShoppingItemSchema>) {
    await this.access.assertAccess(entityId, userId, "purchase");
    const item = await this.requireItem(entityId, listId, itemId, input.version, true);
    if (item.acquisitionId) {
      const existing = await this.acquisitions.findOne({ entityId, acquisitionId: item.acquisitionId });
      if (!existing) throw new ConflictException("Pedido vinculado indisponível.");
      return (await this.views.build([existing]))[0];
    }
    if (input.purchase.status === Acquisition.Status.CANCELLED) throw new BadRequestException("Uma compra cancelada não pode concluir o item.");
    const [payment, prepared] = await Promise.all([
      this.payment.normalize({ ...input.purchase, entityId }),
      this.preparation.prepare({ ...input.purchase, entityId }),
    ]);
    await this.assertPurchaseMatches(item, prepared.items);
    const acquisition = new Acquisition({ ...input.purchase, ...payment, id: randomUUID(), entityId,
      purchaseOrderId: prepared.purchaseOrderId, createdByUserId: userId, updatedByUserId: userId, items: prepared.items,
      notes: [input.purchase.notes, `Lista de compras: ${item.title ?? item.productName ?? item.url}\n${item.url}`].filter(Boolean).join("\n").slice(0, 8000),
    });
    validateAcquisition(acquisition);
    await this.repository.purchase(item, userId, acquisition);
    // Reference prices are secondary; a failure must not undo or duplicate a committed purchase.
    await this.products.recordPurchasePrices({ entityId, userId, purchasedAt: acquisition.purchasedAt,
      source: acquisition.channel ?? acquisition.sellerName, items: acquisition.items.map(line => ({ productId: line.productId, unitPrice: line.costUnitPrice }))
    }).catch(() => console.error("Could not update shopping purchase reference prices", { acquisitionId: acquisition.id }));
    const created = (await this.acquisitions.findOne({ entityId, acquisitionId: acquisition.id! }))!;
    return (await this.views.build([created]))[0];
  }

  private async assertPurchaseMatches(item: ShoppingListItem, lines: Acquisition["items"]) {
    if (item.productId && !lines.some(line => line.productId === item.productId)) throw new BadRequestException("Inclua o produto da lista no pedido.");
    if (item.purchaseOrderItemId && !lines.some(line => line.allocations.some(allocation => allocation.purchaseOrderItemId === item.purchaseOrderItemId))) {
      throw new BadRequestException("Preserve a destinação ao item da OC informado na lista.");
    }
    if (item.purchaseOrderId) {
      const contexts = await this.orders.findItemContexts({ entityId: item.entityId,
        purchaseOrderItemIds: [...new Set(lines.flatMap(line => line.allocations.map(allocation => allocation.purchaseOrderItemId)))] });
      if (!contexts.some(context => context.purchaseOrderId === item.purchaseOrderId)) {
        throw new BadRequestException("Selecione uma destinação para a OC informada na lista de compras.");
      }
    }
  }
}
