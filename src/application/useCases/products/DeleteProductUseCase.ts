import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: DeleteProductUseCase.Input): Promise<void> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const product = await this.productRepository.findOne(input);

    if (!product) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    if (await this.productRepository.isUsed(input)) {
      throw new ConflictException(
        "Este produto ja possui historico. Inative-o em vez de excluir."
      );
    }

    await this.productRepository.delete(input);
  }
}

export namespace DeleteProductUseCase {
  export type Input = {
    productId: string;
    entityId: string;
    userId: string;
  };
}
