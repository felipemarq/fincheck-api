import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { DeleteRecurringTransactionParams } from "./schemas/deleteRecurringTransactionParamsSchema";
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
    const { statusCode } = await this.deteleRecurringTransactionUseCase.execute(
      {
        recurringTransactionId: params.recurringTransactionId,
        entityId: params.entityId,
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
