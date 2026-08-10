import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { QuotationImageStorageService } from "@infra/storage/QuotationImageStorageService";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteQuotationUseCase {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly storageService: QuotationImageStorageService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: DeleteQuotationUseCase.Input): Promise<void> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const quotation = await this.repository.findOne(input);
    if (!quotation) throw new NotFoundException("Cotacao nao encontrada.");

    const deleted = await this.repository.delete(input);
    if (!deleted) throw new NotFoundException("Cotacao nao encontrada.");

    const storageKeys = quotation.items.flatMap((item) =>
      item.images.map((image) => image.storageKey)
    );
    await Promise.allSettled(
      storageKeys.map((key) => this.storageService.delete(key))
    );
  }
}

export namespace DeleteQuotationUseCase {
  export type Input = {
    entityId: string;
    quotationId: string;
    userId: string;
  };
}
