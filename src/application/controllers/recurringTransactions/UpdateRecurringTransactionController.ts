import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { UpdateRecurringTransactionParams } from "./schemas/updateRecurringTransactionParamsSchema";
import {
  UpdateRecurringTransactionBody,
  updateRecurringTransactionSchema,
} from "./schemas/updateRecurringTransactionSchema";
import { UpdateRecurringTransactionUseCase } from "@application/useCases/recurringTransactions/UpdateRecurringTransactionUseCase";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";

@Injectable()
@Schema(updateRecurringTransactionSchema)
export class UpdateRecurringTransactionController extends Controller<
  "private",
  UpdateRecurringTransactionController.Response
> {
  constructor(
    private readonly updateRecurringTransactionUseCase: UpdateRecurringTransactionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdateRecurringTransactionBody,
    UpdateRecurringTransactionParams
  >): Promise<
    Controller.Response<UpdateRecurringTransactionController.Response>
  > {
    const recurringTransaction =
      await this.updateRecurringTransactionUseCase.execute({
        id: params.recurringTransactionId,
        ...body,
        userId,
      });

    return {
      statusCode: 200,
      body: {
        recurringTransaction,
      },
    };
  }
}

export namespace UpdateRecurringTransactionController {
  export type Response = {
    recurringTransaction: RecurringTransaction;
  };
}
