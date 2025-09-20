import { Account } from "@application/entities/Account";
import { AccountRepository } from "@infra/database/neon/repositories/AccountRepository";
import { CategoryRepository } from "@infra/database/neon/repositories/CategoryRepository";
import { TransactionRepository } from "@infra/database/neon/repositories/TransactionRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetTopCategoriesQuery {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute({
    entityId,
    userId,
    from,
    to,
    topN,
  }: GetTopCategoriesQuery.Input): Promise<GetTopCategoriesQuery.Output> {
    const rows = await this.categoryRepository.getTopCategories(
      entityId,
      userId,
      from,
      to,
      topN
    );

    return rows.map((r) => ({
      categoryId: r.categoryId!,
      name: r.name,
      icon: r.icon,
      amount: +Number(r.amount).toFixed(2),
    }));
  }
}

export namespace GetTopCategoriesQuery {
  export type Input = {
    entityId: string;
    userId: string;
    from: Date;
    to: Date;
    topN: number;
  };
  export type Output = Promise<
    {
      categoryId: string;
      name: string;
      icon: string;
      amount: number;
    }[]
  >;
}
