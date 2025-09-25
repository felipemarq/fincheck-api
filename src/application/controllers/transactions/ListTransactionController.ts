import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { DeleteTransactionParams } from "./schemas/deleteTransactionParamsSchema";
import {
  listTransactionQuerySchema,
  ListTransactionQuery,
} from "./schemas/listTransactionQuerySchema";
import { ListTransactionUseCase } from "@application/useCases/transactions/ListTransactionUseCase";
import { Transaction } from "@application/entities/Transaction";
import { TransactionListItem } from "@application/queries/types/TransactionListItem";

@Injectable()
export class ListTransactionController extends Controller<
  "private",
  ListTransactionController.Response
> {
  constructor(private readonly listTransactionUseCase: ListTransactionUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
    queryParams,
  }: Controller.Request<
    "private",
    Record<string, any>,
    Record<string, any>,
    ListTransactionQuery
  >): Promise<Controller.Response<ListTransactionController.Response>> {
    const listTransactionFilters = listTransactionQuerySchema.parse(
      queryParams ?? {}
    );

    const { hasNext, items, total, page, pageSize } =
      await this.listTransactionUseCase.execute({
        ...listTransactionFilters,
        userId,
      });

    return {
      statusCode: 200,
      body: { hasNext, items, total, page, pageSize },
    };
  }
}

export namespace ListTransactionController {
  export type Response = {
    items: TransactionListItem[]; // <<< agora vem com refs
    total: number;
    page: string | undefined;
    pageSize: number;
    hasNext: boolean;
  };
}
