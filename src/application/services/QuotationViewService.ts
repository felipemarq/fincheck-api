import { Quotation } from "@application/entities/Quotation";
import { QuotationView } from "@application/queries/types/QuotationView";
import { QuotationImageStorageService } from "@infra/storage/QuotationImageStorageService";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class QuotationViewService {
  constructor(
    private readonly storageService: QuotationImageStorageService
  ) {}

  async build(quotation: Quotation): Promise<QuotationView> {
    const items = await Promise.all(
      quotation.items.map(async (item) => {
        const images = await Promise.all(
          item.images.map(async (image) => {
            const { storageKey, ...metadata } = image;

            return {
              ...metadata,
              url: await this.storageService.getReadUrl(storageKey),
            };
          })
        );

        return { ...item, images };
      })
    );

    return { ...quotation, items };
  }
}
