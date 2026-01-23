import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  DeleteRecurringTransactionParams,
  deleteRecurringTransactionParamsSchema,
} from "./schemas/deleteRecurringTransactionParamsSchema";
import { DeleteRecurringTransactionUseCase } from "@application/useCases/recurringTransactions/DeleteRecurringTransactionUseCase";

@Injectable()
export class DeleteRecurringTransactionController extends Controller<
  "private",
  DeleteRecurringTransactionController.Response
> {
  constructor(
    private readonly deteleRecurringTransactionUseCase: DeleteRecurringTransactionUseCase
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
    DeleteRecurringTransactionParams
  >): Promise<
    Controller.Response<DeleteRecurringTransactionController.Response>
  > {
    const deleteParams = deleteRecurringTransactionParamsSchema.parse(params);
    const { statusCode } = await this.deteleRecurringTransactionUseCase.execute(
      {
        recurringTransactionId: deleteParams.recurringTransactionId,
        entityId: deleteParams.entityId,
        userId,
      }
    );

    return {
      statusCode: statusCode,
    };
  }
}

export namespace DeleteRecurringTransactionController {
  export type Response = {};
}
