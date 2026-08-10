import { NotFoundException } from "@application/errors/http/NotFoundException";
import { QuotationView } from "@application/queries/types/QuotationView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationViewService } from "@application/services/QuotationViewService";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetQuotationUseCase {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly organizationAccessService: OrganizationAccessService,
    private readonly quotationViewService: QuotationViewService
  ) {}

  async execute({
    entityId,
    quotationId,
    userId,
  }: GetQuotationUseCase.Input): Promise<QuotationView> {
    await this.organizationAccessService.assertUserAccess(entityId, userId);
    const quotation = await this.repository.findOne({ entityId, quotationId });

    if (!quotation) throw new NotFoundException("Cotacao nao encontrada.");

    return this.quotationViewService.build(quotation);
  }
}

export namespace GetQuotationUseCase {
  export type Input = {
    entityId: string;
    quotationId: string;
    userId: string;
  };
}
