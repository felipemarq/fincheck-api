import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { QuotationImageStorageService } from "@infra/storage/QuotationImageStorageService";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteQuotationImageUseCase {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly storageService: QuotationImageStorageService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: DeleteQuotationImageUseCase.Input): Promise<void> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );
    const image = await this.repository.deleteImage(input);
    if (!image) throw new NotFoundException("Imagem da cotacao nao encontrada.");

    await this.storageService.delete(image.storageKey);
  }
}

export namespace DeleteQuotationImageUseCase {
  export type Input = {
    entityId: string;
    quotationId: string;
    imageId: string;
    userId: string;
  };
}
