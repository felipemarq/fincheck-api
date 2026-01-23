import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  CreateTransactionBody,
  createTransactionSchema,
} from "./schemas/createTransactionSchema";
import { CreateTransactionUseCase } from "@application/useCases/transactions/CreateTransactionUseCase";
import { Transaction } from "@application/entities/Transaction";

@Injectable()
@Schema(createTransactionSchema)
export class CreateTransactionController extends Controller<
  "private",
  CreateTransactionController.Response
> {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
  }: Controller.Request<"private", CreateTransactionBody>): Promise<
    Controller.Response<CreateTransactionController.Response>
  > {
    const transaction = await this.createTransactionUseCase.execute({
      ...body,
      userId,
    });

    return {
      statusCode: 201,
      body: {
        transaction,
      },
    };
  }
}

export namespace CreateTransactionController {
  export type Response = {
    transaction: Transaction;
  };
}
