import { Schema } from "@kernel/decorators/Schema";

import { Controller } from "@application/contracts/Controller";

import { Injectable } from "@kernel/decorators/Injectable";
import {
  CreateAccountBody,
  createAccountSchema,
} from "./schemas/createAccountSchema";
import { CreateAccountUseCase } from "@application/useCases/accounts/CreateAccountUseCase";
import { Account } from "@application/entities/Account";

@Injectable()
@Schema(createAccountSchema)
export class CreateAccountController extends Controller<
  "private",
  CreateAccountController.Response
> {
  constructor(private readonly createAccountUseCase: CreateAccountUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
  }: Controller.Request<"private", CreateAccountBody>): Promise<
    Controller.Response<CreateAccountController.Response>
  > {
    const account = await this.createAccountUseCase.execute({
      userId,
      ...body,
    });

    return {
      statusCode: 201,
      body: {
        account,
      },
    };
  }
}

export namespace CreateAccountController {
  export type Response = {
    account: Account;
  };
}
