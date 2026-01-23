import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Transaction } from "@application/entities/Transaction";
import {
  UpdateTransactionBody,
  updateTransactionSchema,
} from "./schemas/updateTransactionSchema";
import { UpdateTransactionUseCase } from "@application/useCases/transactions/UpdateTransactionUseCase";
import {
  UpdateTransactionParams,
  updateTransactionParamsSchema,
} from "./schemas/updateTransactionParamsSchema";

@Injectable()
@Schema(updateTransactionSchema)
export class UpdateTransactionController extends Controller<
  "private",
  UpdateTransactionController.Response
> {
  constructor(
    private readonly updateTransactionUseCase: UpdateTransactionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdateTransactionBody,
    UpdateTransactionParams
  >): Promise<Controller.Response<UpdateTransactionController.Response>> {
    const updateParams = updateTransactionParamsSchema.parse(params);
    const transaction = await this.updateTransactionUseCase.execute({
      id: updateParams.transactionId,
      ...body,
      userId,
    });

    return {
      statusCode: 200,
      body: {
        transaction,
      },
    };
  }
}

export namespace UpdateTransactionController {
  export type Response = {
    transaction: Transaction;
  };
}
