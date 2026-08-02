import { Product } from "@application/entities/Product";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: ListProductsUseCase.Input
  ): Promise<{ products: Product[] }> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    return { products: await this.productRepository.listAll(input) };
  }
}

export namespace ListProductsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    search?: string;
    active?: boolean;
  };
}
