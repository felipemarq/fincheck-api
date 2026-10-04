import { Controller } from "@application/contracts/Controller";
import { ShoppingListService } from "@application/useCases/shoppingLists/ShoppingListService";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { Injectable } from "@kernel/decorators/Injectable";
import { addShoppingItemsSchema, checkShoppingItemSchema, createShoppingListSchema, deleteShoppingItemSchema, purchaseShoppingItemSchema, shoppingParamsSchema, updateShoppingItemSchema, updateShoppingListSchema } from "./shoppingListSchemas";

@Injectable()
export class ShoppingListController extends Controller<"private", unknown> {
  constructor(private readonly service: ShoppingListService) { super(); }

  protected override async handle({ userId, body, params }: Controller.Request<"private">) {
    const { entityId, shoppingListId, itemId } = shoppingParamsSchema.parse(params);
    const operation = params.operation;
    const action = ["list", "detail"].includes(operation as string) ? "read"
      : ["check", "purchase"].includes(operation as string) ? "purchase" : "edit";
    await this.service.access.assertAccess(entityId, userId, action);
    const repository = this.service.repository;
    if (operation === "list") return { statusCode: 200, body: { lists: await repository.list(entityId) } };
    if (operation === "create") {
      return { statusCode: 201, body: { list: await repository.create(entityId, userId, createShoppingListSchema.parse(body)) } };
    }
    if (!shoppingListId) throw new BadRequestException("Informe a lista.");
    await this.service.requireList(entityId, shoppingListId, operation !== "detail" && operation !== "updateList");
    if (operation === "detail") {
      const list = await this.service.requireList(entityId, shoppingListId);
      return { statusCode: 200, body: { list, items: await repository.listItems(entityId, shoppingListId) } };
    }
    if (operation === "updateList") {
      const list = await repository.updateList(entityId, shoppingListId, userId, updateShoppingListSchema.parse(body));
      return { statusCode: 200, body: { list } };
    }
    if (operation === "add") {
      const input = addShoppingItemsSchema.parse(body);
      const normalized = await Promise.all(input.items.map(item => this.service.validateLinks(entityId, item)));
      await repository.addItems(entityId, shoppingListId, userId, normalized);
      return { statusCode: 201, body: { items: await repository.listItems(entityId, shoppingListId) } };
    }
    if (!itemId) throw new BadRequestException("Informe o item.");
    if (operation === "purchase") {
      const acquisition = await this.service.purchase(entityId, shoppingListId, itemId, userId, purchaseShoppingItemSchema.parse(body));
      return { statusCode: 200, body: { acquisition } };
    }
    if (operation === "updateItem") {
      const { version, ...input } = updateShoppingItemSchema.parse(body);
      const item = await this.service.requireItem(entityId, shoppingListId, itemId, version);
      await repository.updateItem(item, userId, await this.service.validateLinks(entityId, input));
    } else if (operation === "check") {
      const input = checkShoppingItemSchema.parse(body);
      const item = await this.service.requireItem(entityId, shoppingListId, itemId, input.version);
      if (Boolean(item.purchasedAt) !== input.purchased) await repository.check(item, userId, input.purchased);
    } else if (operation === "delete") {
      const input = deleteShoppingItemSchema.parse(body);
      const item = await this.service.requireItem(entityId, shoppingListId, itemId, input.version);
      await repository.remove(item);
    } else throw new BadRequestException("Ação inválida.");
    return { statusCode: 200, body: { items: await repository.listItems(entityId, shoppingListId) } };
  }
}
