import {
  Quotation,
  QuotationItemImage,
} from "@application/entities/Quotation";

export type QuotationImageView = Omit<QuotationItemImage, "storageKey"> & {
  url: string;
};

export type QuotationView = Omit<Quotation, "items"> & {
  items: Array<
    Omit<Quotation["items"][number], "images"> & {
      images: QuotationImageView[];
    }
  >;
};

export type QuotationSummaryView = Omit<
  Quotation,
  "items" | "internalNotes"
> & {
  itemCount: number;
  imageCount: number;
};
