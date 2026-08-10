import {
  Quotation,
  QuotationItem,
  QuotationItemImage,
} from "@application/entities/Quotation";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import { DatabaseService } from "..";
import {
  quotationItemImagesTable,
  quotationItemsTable,
  quotationsTable,
} from "../schema";

type ListFilters = {
  entityId: string;
  customerId?: string;
  status?: Quotation.Status;
  search?: string;
};

type QuotationSummaryRecord = {
  quotation: Quotation;
  itemCount: number;
  imageCount: number;
};

function imageFromRow(
  row: typeof quotationItemImagesTable.$inferSelect
): QuotationItemImage {
  return new QuotationItemImage({
    ...row,
  });
}

function itemFromRow(
  row: typeof quotationItemsTable.$inferSelect,
  images: QuotationItemImage[] = []
): QuotationItem {
  return new QuotationItem({
    ...row,
    productCode: row.productCode ?? undefined,
    specification: row.specification ?? undefined,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice),
    total: Number(row.total),
    notes: row.notes ?? undefined,
    images,
  });
}

function quotationFromRow(
  row: typeof quotationsTable.$inferSelect,
  items: QuotationItem[] = []
): Quotation {
  return new Quotation({
    ...row,
    status: row.status as Quotation.Status,
    validUntil: row.validUntil ?? undefined,
    sellerDocument: row.sellerDocument ?? undefined,
    sellerEmail: row.sellerEmail ?? undefined,
    sellerPhone: row.sellerPhone ?? undefined,
    sellerAddress: row.sellerAddress ?? undefined,
    customerTradeName: row.customerTradeName ?? undefined,
    customerEmail: row.customerEmail ?? undefined,
    customerPhone: row.customerPhone ?? undefined,
    customerAddress: row.customerAddress ?? undefined,
    paymentTerms: row.paymentTerms ?? undefined,
    deliveryTerms: row.deliveryTerms ?? undefined,
    notes: row.notes ?? undefined,
    internalNotes: row.internalNotes ?? undefined,
    subtotal: Number(row.subtotal),
    freight: Number(row.freight),
    discount: Number(row.discount),
    total: Number(row.total),
    items,
  });
}

function quotationToRow(quotation: Quotation) {
  return {
    id: quotation.id,
    entityId: quotation.entityId,
    customerId: quotation.customerId,
    createdByUserId: quotation.createdByUserId,
    updatedByUserId: quotation.updatedByUserId,
    number: quotation.number,
    status: quotation.status,
    issuedAt: quotation.issuedAt,
    validUntil: quotation.validUntil ?? null,
    sellerName: quotation.sellerName,
    sellerDocument: quotation.sellerDocument ?? null,
    sellerEmail: quotation.sellerEmail ?? null,
    sellerPhone: quotation.sellerPhone ?? null,
    sellerAddress: quotation.sellerAddress ?? null,
    customerLegalName: quotation.customerLegalName,
    customerTradeName: quotation.customerTradeName ?? null,
    customerDocument: quotation.customerDocument,
    customerEmail: quotation.customerEmail ?? null,
    customerPhone: quotation.customerPhone ?? null,
    customerAddress: quotation.customerAddress ?? null,
    paymentTerms: quotation.paymentTerms ?? null,
    deliveryTerms: quotation.deliveryTerms ?? null,
    notes: quotation.notes ?? null,
    internalNotes: quotation.internalNotes ?? null,
    subtotal: quotation.subtotal.toFixed(2),
    freight: quotation.freight.toFixed(2),
    discount: quotation.discount.toFixed(2),
    total: quotation.total.toFixed(2),
  };
}

function itemToRow(item: QuotationItem) {
  return {
    id: item.id,
    entityId: item.entityId,
    quotationId: item.quotationId,
    productId: item.productId,
    lineNumber: item.lineNumber,
    productCode: item.productCode ?? null,
    description: item.description,
    brand: item.brand,
    specification: item.specification ?? null,
    unit: item.unit,
    quantity: item.quantity.toFixed(3),
    unitPrice: item.unitPrice.toFixed(6),
    total: item.total.toFixed(2),
    notes: item.notes ?? null,
  };
}

@Injectable()
export class QuotationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(quotation: Quotation): Promise<Quotation> {
    await this.databaseService.db.batch([
      this.databaseService.db
        .insert(quotationsTable)
        .values(quotationToRow(quotation)),
      this.databaseService.db
        .insert(quotationItemsTable)
        .values(quotation.items.map(itemToRow)),
    ]);

    return (await this.findOne({
      entityId: quotation.entityId,
      quotationId: quotation.id,
    }))!;
  }

  async update(quotation: Quotation): Promise<Quotation> {
    const {
      id: _id,
      entityId: _entityId,
      createdByUserId: _createdByUserId,
      ...quotationValues
    } = quotationToRow(quotation);
    const itemRows = quotation.items.map(itemToRow);
    const itemIds = quotation.items.map((item) => item.id);

    await this.databaseService.db.batch([
      this.databaseService.db
        .update(quotationsTable)
        .set({ ...quotationValues, updatedAt: new Date() })
        .where(
          and(
            eq(quotationsTable.id, quotation.id),
            eq(quotationsTable.entityId, quotation.entityId)
          )
        ),
      this.databaseService.db
        .update(quotationItemsTable)
        .set({ lineNumber: sql`${quotationItemsTable.lineNumber} * -1` })
        .where(
          and(
            eq(quotationItemsTable.quotationId, quotation.id),
            eq(quotationItemsTable.entityId, quotation.entityId)
          )
        ),
      this.databaseService.db
        .insert(quotationItemsTable)
        .values(itemRows)
        .onConflictDoUpdate({
          target: quotationItemsTable.id,
          set: {
            productId: sql`excluded.product_id`,
            lineNumber: sql`excluded.line_number`,
            productCode: sql`excluded.product_code`,
            description: sql`excluded.description`,
            brand: sql`excluded.brand`,
            specification: sql`excluded.specification`,
            unit: sql`excluded.unit`,
            quantity: sql`excluded.quantity`,
            unitPrice: sql`excluded.unit_price`,
            total: sql`excluded.total`,
            notes: sql`excluded.notes`,
            updatedAt: new Date(),
          },
        }),
      this.databaseService.db
        .delete(quotationItemsTable)
        .where(
          and(
            eq(quotationItemsTable.quotationId, quotation.id),
            eq(quotationItemsTable.entityId, quotation.entityId),
            notInArray(quotationItemsTable.id, itemIds)
          )
        ),
    ]);

    return (await this.findOne({
      entityId: quotation.entityId,
      quotationId: quotation.id,
    }))!;
  }

  async delete({
    entityId,
    quotationId,
  }: {
    entityId: string;
    quotationId: string;
  }): Promise<boolean> {
    const deleted = await this.databaseService.db
      .delete(quotationsTable)
      .where(
        and(
          eq(quotationsTable.id, quotationId),
          eq(quotationsTable.entityId, entityId)
        )
      )
      .returning({ id: quotationsTable.id });

    return deleted.length > 0;
  }

  async findByNumber({
    entityId,
    number,
  }: {
    entityId: string;
    number: string;
  }): Promise<Quotation | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(quotationsTable)
      .where(
        and(
          eq(quotationsTable.entityId, entityId),
          eq(quotationsTable.number, number)
        )
      )
      .limit(1);

    return row ? quotationFromRow(row) : null;
  }

  async findOne({
    entityId,
    quotationId,
  }: {
    entityId: string;
    quotationId: string;
  }): Promise<Quotation | null> {
    const [quotationRow] = await this.databaseService.db
      .select()
      .from(quotationsTable)
      .where(
        and(
          eq(quotationsTable.id, quotationId),
          eq(quotationsTable.entityId, entityId)
        )
      )
      .limit(1);

    if (!quotationRow) return null;

    const itemRows = await this.databaseService.db
      .select()
      .from(quotationItemsTable)
      .where(
        and(
          eq(quotationItemsTable.quotationId, quotationId),
          eq(quotationItemsTable.entityId, entityId)
        )
      )
      .orderBy(asc(quotationItemsTable.lineNumber));

    const imageRows = itemRows.length
      ? await this.databaseService.db
          .select()
          .from(quotationItemImagesTable)
          .where(
            and(
              eq(quotationItemImagesTable.entityId, entityId),
              inArray(
                quotationItemImagesTable.quotationItemId,
                itemRows.map((item) => item.id)
              )
            )
          )
          .orderBy(
            asc(quotationItemImagesTable.sortOrder),
            asc(quotationItemImagesTable.createdAt)
          )
      : [];

    const imagesByItemId = new Map<string, QuotationItemImage[]>();
    imageRows.forEach((row) => {
      const current = imagesByItemId.get(row.quotationItemId) ?? [];
      current.push(imageFromRow(row));
      imagesByItemId.set(row.quotationItemId, current);
    });

    return quotationFromRow(
      quotationRow,
      itemRows.map((row) => itemFromRow(row, imagesByItemId.get(row.id)))
    );
  }

  async listAll(filters: ListFilters): Promise<QuotationSummaryRecord[]> {
    const conditions = [eq(quotationsTable.entityId, filters.entityId)];

    if (filters.customerId) {
      conditions.push(eq(quotationsTable.customerId, filters.customerId));
    }

    if (filters.status) {
      conditions.push(eq(quotationsTable.status, filters.status));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(quotationsTable.number, `%${filters.search}%`),
          ilike(quotationsTable.customerLegalName, `%${filters.search}%`),
          ilike(quotationsTable.customerTradeName, `%${filters.search}%`),
          ilike(quotationsTable.customerDocument, `%${filters.search}%`)
        )!
      );
    }

    const quotationRows = await this.databaseService.db
      .select()
      .from(quotationsTable)
      .where(and(...conditions))
      .orderBy(desc(quotationsTable.issuedAt), desc(quotationsTable.createdAt));

    if (!quotationRows.length) return [];

    const quotationIds = quotationRows.map((row) => row.id);
    const [itemRows, imageRows] = await Promise.all([
      this.databaseService.db
        .select({ id: quotationItemsTable.id, quotationId: quotationItemsTable.quotationId })
        .from(quotationItemsTable)
        .where(inArray(quotationItemsTable.quotationId, quotationIds)),
      this.databaseService.db
        .select({ quotationId: quotationItemImagesTable.quotationId })
        .from(quotationItemImagesTable)
        .where(inArray(quotationItemImagesTable.quotationId, quotationIds)),
    ]);

    return quotationRows.map((row) => ({
      quotation: quotationFromRow(row),
      itemCount: itemRows.filter((item) => item.quotationId === row.id).length,
      imageCount: imageRows.filter((image) => image.quotationId === row.id).length,
    }));
  }

  async findItem({
    entityId,
    quotationId,
    quotationItemId,
  }: {
    entityId: string;
    quotationId: string;
    quotationItemId: string;
  }): Promise<QuotationItem | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(quotationItemsTable)
      .where(
        and(
          eq(quotationItemsTable.id, quotationItemId),
          eq(quotationItemsTable.quotationId, quotationId),
          eq(quotationItemsTable.entityId, entityId)
        )
      )
      .limit(1);

    return row ? itemFromRow(row) : null;
  }

  async countImages(quotationItemId: string): Promise<number> {
    const rows = await this.databaseService.db
      .select({ id: quotationItemImagesTable.id })
      .from(quotationItemImagesTable)
      .where(eq(quotationItemImagesTable.quotationItemId, quotationItemId));

    return rows.length;
  }

  async addImage(image: QuotationItemImage): Promise<QuotationItemImage> {
    const [created] = await this.databaseService.db
      .insert(quotationItemImagesTable)
      .values({
        id: image.id,
        entityId: image.entityId,
        quotationId: image.quotationId,
        quotationItemId: image.quotationItemId,
        storageKey: image.storageKey,
        fileName: image.fileName,
        contentType: image.contentType,
        size: image.size,
        sortOrder: image.sortOrder,
      })
      .returning();

    return imageFromRow(created);
  }

  async deleteImage({
    entityId,
    quotationId,
    imageId,
  }: {
    entityId: string;
    quotationId: string;
    imageId: string;
  }): Promise<QuotationItemImage | null> {
    const [deleted] = await this.databaseService.db
      .delete(quotationItemImagesTable)
      .where(
        and(
          eq(quotationItemImagesTable.id, imageId),
          eq(quotationItemImagesTable.quotationId, quotationId),
          eq(quotationItemImagesTable.entityId, entityId)
        )
      )
      .returning();

    return deleted ? imageFromRow(deleted) : null;
  }
}

export type { QuotationSummaryRecord };
