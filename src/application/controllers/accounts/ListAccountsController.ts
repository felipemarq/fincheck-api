import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Account } from "@application/entities/Account";
import { ListAccountsUseCase } from "@application/useCases/accounts/ListAccountsUseCase";
import {
  ListAccountsParams,
  listAccountsParamsSchema,
} from "./schemas/listAccountsParamsSchema";
import { Schema } from "@kernel/decorators/Schema";

@Injectable()
export class ListAccountsController extends Controller<
  "private",
  ListAccountsController.Response
> {
  constructor(private readonly listAccountsUseCase: ListAccountsUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    Record<string, any>,
    ListAccountsParams
  >): Promise<Controller.Response<ListAccountsController.Response>> {
    console.log({ params });

    const accounts = await this.listAccountsUseCase.execute({
      entityId: params.entityId,
      userId,
    });

    return {
      statusCode: 200,
      body: {
        accounts,
      },
    };
  }
}

export namespace ListAccountsController {
  export type Response = { accounts: Account[] };
}
