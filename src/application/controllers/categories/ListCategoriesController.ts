import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { Category } from "@application/entities/Category";
import { ListCategoriesUseCase } from "@application/useCases/categories/ListCategoriesUseCase";
import {
  listCategoriesQuerySchema,
  ListCategoriesQuery,
} from "./schemas/listCategoriesQuerySchema";

@Injectable()
export class ListCategoriesController extends Controller<
  "private",
  ListCategoriesController.Response
> {
  constructor(private readonly listCategoriesUseCase: ListCategoriesUseCase) {
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
    ListCategoriesQuery
  >): Promise<Controller.Response<ListCategoriesController.Response>> {
    const listCategoriesFilters = listCategoriesQuerySchema.parse(
      queryParams ?? {}
    );

    const { categories } = await this.listCategoriesUseCase.execute({
      ...listCategoriesFilters,
      userId,
    });

    return {
      statusCode: 200,
      body: { categories },
    };
  }
}

export namespace ListCategoriesController {
  export type Response = {
    categories: Category[];
  };
}
