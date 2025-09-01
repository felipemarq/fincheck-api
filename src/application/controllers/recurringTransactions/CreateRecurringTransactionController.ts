import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  CreateRecurringTransactionBody,
  createRecurringTransactionSchema,
} from "./schemas/createRecurringTransactionSchema";

import { Transaction } from "@application/entities/Transaction";
import { CreateRecurringTransactionUseCase } from "@application/useCases/recurringTransactions/CreateRecurringTransactionUseCase";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";

@Injectable()
@Schema(createRecurringTransactionSchema)
export class CreateRecurringTransactionController extends Controller<
  "private",
  CreateRecurringTransactionController.Response
> {
  constructor(
    private readonly createRecurringTransactionUseCase: CreateRecurringTransactionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
  }: Controller.Request<"private", CreateRecurringTransactionBody>): Promise<
    Controller.Response<CreateRecurringTransactionController.Response>
  > {
    const recurringTransaction =
      await this.createRecurringTransactionUseCase.execute({
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

export namespace CreateRecurringTransactionController {
  export type Response = {
    recurringTransaction: RecurringTransaction;
  };
}
