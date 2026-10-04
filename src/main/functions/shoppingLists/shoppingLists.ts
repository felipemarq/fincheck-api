import "reflect-metadata";
import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { ShoppingListController } from "@application/controllers/shoppingLists/ShoppingListController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

const root = "/entities/{entityId}/shopping-lists";
const list = `${root}/{shoppingListId}`;
const item = `${list}/items/{itemId}`;
const routes: Record<string, string> = {
  [`GET ${root}`]: "list", [`POST ${root}`]: "create",
  [`GET ${list}`]: "detail", [`PATCH ${list}`]: "updateList",
  [`POST ${list}/items`]: "add", [`PUT ${item}`]: "updateItem",
  [`DELETE ${item}`]: "delete", [`PATCH ${item}/check`]: "check", [`POST ${item}/purchase`]: "purchase",
};
const adapter = lambdaHttpAdapter(ShoppingListController);

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const operation = routes[event.routeKey];
  if (!operation) return { statusCode: 404, body: JSON.stringify({ message: "Rota não encontrada." }) };
  return adapter({ ...event, pathParameters: { ...event.pathParameters, operation } });
};
