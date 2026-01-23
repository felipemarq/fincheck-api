import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Transaction } from "@application/entities/Transaction";
import {
  DeleteTransactionParams,
  deleteTransactionParamsSchema,
} from "./schemas/deleteTransactionParamsSchema";
import { DeleteTransactionUseCase } from "@application/useCases/transactions/DeleteTransactionUseCase";

@Injectable()
export class DeleteTransactionController extends Controller<
  "private",
  DeleteTransactionController.Response
> {
  constructor(
    private readonly deteleTransactionUseCase: DeleteTransactionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    Record<string, any>,
    DeleteTransactionParams
  >): Promise<Controller.Response<DeleteTransactionController.Response>> {
    const deleteParams = deleteTransactionParamsSchema.parse(params);
    const { statusCode } = await this.deteleTransactionUseCase.execute({
      trasactionId: deleteParams.transactionId,
      entityId: deleteParams.entityId,
      userId,
    });

    return {
      statusCode: statusCode,
    };
  }
}

export namespace DeleteTransactionController {
  export type Response = {};
}
