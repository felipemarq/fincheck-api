import "reflect-metadata";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { ZodError } from "zod";
import { CreateInvoiceController } from "@application/controllers/invoices/CreateInvoiceController";
import { UpdateInvoiceController } from "@application/controllers/invoices/UpdateInvoiceController";
import { ListInvoicesController } from "@application/controllers/invoices/ListInvoicesController";
import { CreateReceivablePaymentController } from "@application/controllers/invoices/CreateReceivablePaymentController";
import { UpdateReceivablePaymentController } from "@application/controllers/invoices/UpdateReceivablePaymentController";
import { ListReceivablesController } from "@application/controllers/receivables/ListReceivablesController";
import { GetOperationsDashboardController } from "@application/controllers/dashboard/GetOperationsDashboardController";
import { HttpError } from "@application/errors/http/HttpError";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { ErrorCode } from "@application/errors/ErrorCode";
import { Registry } from "@kernel/di/Registry";
import { lambdaBodyParser } from "@main/utils/lambdaBodyParser";
import { lambdaErrorResponse } from "@main/utils/lambdaErrorResponse";
import { Controller } from "@application/contracts/Controller";
import { Constructor } from "@shared/types/Constructor";

const root = "/entities/{entityId}";
const collections = [
  `${root}/invoices`,
  `${root}/purchase-orders/{purchaseOrderId}/invoices`,
];
const controllers = new Map<
  string,
  Constructor<Controller<"private", unknown>>
>();
for (const path of collections) {
  controllers.set(`GET ${path}`, ListInvoicesController);
  controllers.set(`POST ${path}`, CreateInvoiceController);
  controllers.set(`PATCH ${path}/{invoiceId}`, UpdateInvoiceController);
  controllers.set(
    `POST ${path}/{invoiceId}/payments`,
    CreateReceivablePaymentController,
  );
  controllers.set(
    `PATCH ${path}/{invoiceId}/payments/{paymentId}`,
    UpdateReceivablePaymentController,
  );
}
controllers.set(`GET ${root}/receivables`, ListReceivablesController);
controllers.set(
  `GET ${root}/operations-dashboard`,
  GetOperationsDashboardController,
);

/** Additive deployment: uses the existing JWT authorizer and verifies each action in its use case. */
export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> {
  try {
    const userId = event.requestContext.authorizer?.jwt?.claims?.internalId;
    if (typeof userId !== "string" || !userId)
      throw new UnauthorizedException("Autenticacao obrigatoria.");
    const controller = controllers.get(event.routeKey);
    if (!controller)
      throw new NotFoundException("Rota financeira nao encontrada.");
    const response = await Registry.getInstance()
      .resolve(controller)
      .execute({
        userId,
        body: lambdaBodyParser(event.body),
        params: event.pathParameters ?? {},
        queryParams: event.queryStringParameters ?? {},
      });
    return {
      statusCode: response.statusCode,
      body: response.body ? JSON.stringify(response.body) : undefined,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return lambdaErrorResponse({
        code: ErrorCode.VALIDATION,
        statusCode: 400,
        message: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    if (error instanceof HttpError) return lambdaErrorResponse(error);
    console.error("Financial request failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return lambdaErrorResponse({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      message: "Internal server error",
    });
  }
}
