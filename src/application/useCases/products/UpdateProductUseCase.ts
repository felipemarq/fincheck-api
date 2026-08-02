import { Product } from "@application/entities/Product";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: UpdateProductUseCase.Input): Promise<Product> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const current = await this.productRepository.findOne(input);

    if (!current) {
      throw new NotFoundException("Produto nao encontrado.");
    }

    const name = input.name ?? current.name;
    const brand = input.brand ?? current.brand;
    const packaging = input.packaging ?? current.packaging;
    const duplicate = await this.productRepository.findDuplicate({
      entityId: input.entityId,
      name,
      brand,
      packaging,
    });

    if (duplicate && duplicate.id !== current.id) {
      throw new ConflictException(
        "Ja existe um produto com este nome, marca e embalagem na organizacao."
      );
    }

    const now = new Date();
    return this.productRepository.update(
      new Product({
        ...current,
        id: current.id,
        name,
        brand,
        packaging,
        specification:
          input.specification === null
            ? undefined
            : input.specification ?? current.specification,
        normalizedUnit: input.normalizedUnit ?? current.normalizedUnit,
        lastPurchasePrice:
          input.lastPurchasePrice === null
            ? undefined
            : input.lastPurchasePrice ?? current.lastPurchasePrice,
        lastPurchaseSource:
          input.lastPurchaseSource === null
            ? undefined
            : input.lastPurchaseSource ?? current.lastPurchaseSource,
        lastPurchasedAt:
          input.lastPurchasePrice === null
            ? undefined
            : input.lastPurchasePrice === undefined
              ? current.lastPurchasedAt
              : now,
        lastSalePrice:
          input.lastSalePrice === null
            ? undefined
            : input.lastSalePrice ?? current.lastSalePrice,
        lastSoldAt:
          input.lastSalePrice === null
            ? undefined
            : input.lastSalePrice === undefined
              ? current.lastSoldAt
              : now,
        active: input.active ?? current.active,
        updatedByUserId: input.userId,
      })
    );
  }
}

export namespace UpdateProductUseCase {
  export type Input = {
    productId: string;
    entityId: string;
    userId: string;
    name?: string;
    brand?: string;
    specification?: string | null;
    packaging?: string;
    normalizedUnit?: string;
    lastPurchasePrice?: number | null;
    lastPurchaseSource?: string | null;
    lastSalePrice?: number | null;
    active?: boolean;
  };
}
