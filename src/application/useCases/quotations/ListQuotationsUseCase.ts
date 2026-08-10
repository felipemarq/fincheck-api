import { Quotation } from "@application/entities/Quotation";
import { QuotationSummaryView } from "@application/queries/types/QuotationView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListQuotationsUseCase {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: ListQuotationsUseCase.Input): Promise<QuotationSummaryView[]> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const records = await this.repository.listAll(input);

    return records.map(({ quotation, itemCount, imageCount }) => {
      const { items: _items, internalNotes: _internalNotes, ...summary } = quotation;
      return { ...summary, itemCount, imageCount };
    });
  }
}

export namespace ListQuotationsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    customerId?: string;
    status?: Quotation.Status;
    search?: string;
  };
}
