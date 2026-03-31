import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { DeleteAccountUseCase } from "@application/useCases/accounts/DeleteAccountUseCase";

import { AccountParams, accountParamsSchema } from "./schemas/accountParamsSchema";

@Injectable()
export class DeleteAccountController extends Controller<
  "private",
  DeleteAccountController.Response
> {
  constructor(private readonly deleteAccountUseCase: DeleteAccountUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<"private", Record<string, never>, AccountParams>) {
    const deleteParams = accountParamsSchema.parse(params);

    const { statusCode } = await this.deleteAccountUseCase.execute({
      accountId: deleteParams.accountId,
      entityId: deleteParams.entityId,
      userId,
    });

    return {
      statusCode,
    };
  }
}

export namespace DeleteAccountController {
  export type Response = Record<string, never>;
}
