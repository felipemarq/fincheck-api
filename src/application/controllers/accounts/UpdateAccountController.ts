import { Controller } from "@application/contracts/Controller";
import { Account } from "@application/entities/Account";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { UpdateAccountUseCase } from "@application/useCases/accounts/UpdateAccountUseCase";

import { AccountParams, accountParamsSchema } from "./schemas/accountParamsSchema";
import {
  UpdateAccountBody,
  updateAccountSchema,
} from "./schemas/updateAccountSchema";

@Injectable()
@Schema(updateAccountSchema)
export class UpdateAccountController extends Controller<
  "private",
  UpdateAccountController.Response
> {
  constructor(private readonly updateAccountUseCase: UpdateAccountUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateAccountBody, AccountParams>) {
    const updateParams = accountParamsSchema.parse(params);

    const account = await this.updateAccountUseCase.execute({
      id: updateParams.accountId,
      entityId: updateParams.entityId,
      userId,
      ...body,
    });

    return {
      statusCode: 200,
      body: { account },
    };
  }
}

export namespace UpdateAccountController {
  export type Response = {
    account: Account;
  };
}
