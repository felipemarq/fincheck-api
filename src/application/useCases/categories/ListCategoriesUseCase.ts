import { ListCategoriesQuery } from "@application/controllers/categories/schemas/listCategoriesQuerySchema";
import { ListCreditCardsQuery } from "@application/controllers/creditCards/schemas/listCreditCardsQuerySchema";
import { Category } from "@application/entities/Category";
import { CreditCard } from "@application/entities/CreditCard";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { CategoryRepository } from "@infra/database/neon/repositories/CategoryRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute(
    listCategoriesInput: ListCategoriesUseCase.Input
  ): Promise<ListCategoriesUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId: listCategoriesInput.userId,
      entityId: listCategoriesInput.entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para visualizar categorias nessa entidade."
      );
    }

    const categories = await this.categoryRepository.listAll({
      filters: {
        entityId: listCategoriesInput.entityId,
      },
      userId: listCategoriesInput.userId,
    });

    return { categories };
  }
}

export namespace ListCategoriesUseCase {
  export type Input = ListCategoriesQuery & { userId: string };
  export type Output = {
    categories: Category[];
  };
}
