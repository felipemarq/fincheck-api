import { Product } from "@application/entities/Product";
import { ConflictException } from "@application/errors/http/ConflictException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: CreateProductUseCase.Input): Promise<Product> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const brand = input.brand || "Outros";
    const duplicate = await this.productRepository.findDuplicate({
      entityId: input.entityId,
      name: input.name,
      brand,
      packaging: input.packaging,
    });

    if (duplicate) {
      throw new ConflictException(
        "Ja existe um produto com este nome, marca e embalagem na organizacao."
      );
    }

    const now = new Date();
    return this.productRepository.create(
      new Product({
        ...input,
        brand,
        createdByUserId: input.userId,
        updatedByUserId: input.userId,
        lastPurchasedAt:
          input.lastPurchasePrice === undefined ? undefined : now,
        lastSoldAt: input.lastSalePrice === undefined ? undefined : now,
      })
    );
  }
}

export namespace CreateProductUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    name: string;
    brand: string;
    specification?: string;
    packaging: string;
    normalizedUnit: string;
    lastPurchasePrice?: number;
    lastPurchaseSource?: string;
    lastSalePrice?: number;
    active?: boolean;
  };
}
