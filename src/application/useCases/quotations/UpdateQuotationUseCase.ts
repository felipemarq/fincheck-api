import { Quotation, QuotationItem } from "@application/entities/Quotation";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { QuotationView } from "@application/queries/types/QuotationView";
import { calculateQuotationTotals } from "@application/services/calculateQuotationTotals";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationViewService } from "@application/services/QuotationViewService";
import { CustomerRepository } from "@infra/database/neon/repositories/CustomerRepository";
import { ProductRepository } from "@infra/database/neon/repositories/ProductRepository";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { QuotationImageStorageService } from "@infra/storage/QuotationImageStorageService";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";

@Injectable()
export class UpdateQuotationUseCase {
  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly organizationAccessService: OrganizationAccessService,
    private readonly quotationViewService: QuotationViewService,
    private readonly storageService: QuotationImageStorageService
  ) {}

  async execute(input: UpdateQuotationUseCase.Input): Promise<QuotationView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const existing = await this.quotationRepository.findOne({
      entityId: input.entityId,
      quotationId: input.quotationId,
    });
    if (!existing) throw new NotFoundException("Cotacao nao encontrada.");

    if (input.validUntil && input.validUntil < input.issuedAt) {
      throw new BadRequestException(
        "A validade da cotacao nao pode ser anterior a emissao."
      );
    }

    const existingItemsById = new Map(
      existing.items.map((item) => [item.id, item])
    );
    for (const item of input.items) {
      if (item.id && !existingItemsById.has(item.id)) {
        throw new BadRequestException(
          "Um dos itens informados nao pertence a esta cotacao."
        );
      }
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const [customer, duplicate, products] = await Promise.all([
      this.customerRepository.findOne({
        entityId: input.entityId,
        customerId: input.customerId,
      }),
      this.quotationRepository.findByNumber({
        entityId: input.entityId,
        number: input.number,
      }),
      this.productRepository.findMany({
        entityId: input.entityId,
        productIds,
      }),
    ]);

    if (!customer) throw new NotFoundException("Cliente nao encontrado.");
    if (!customer.active) {
      throw new BadRequestException(
        "Nao e possivel cotar para um cliente inativo."
      );
    }
    if (duplicate && duplicate.id !== existing.id) {
      throw new ConflictException(
        "Ja existe uma cotacao com este numero na organizacao."
      );
    }

    const productsById = new Map(
      products.map((product) => [product.id!, product])
    );
    for (const item of input.items) {
      const product = productsById.get(item.productId);
      if (!product) throw new NotFoundException("Produto nao encontrado.");
      if (!product.active) {
        throw new BadRequestException(
          `O produto "${product.name}" esta inativo e nao pode ser cotado.`
        );
      }
    }

    const totals = calculateQuotationTotals(input);
    const quotation = new Quotation({
      id: existing.id,
      entityId: input.entityId,
      customerId: input.customerId,
      createdByUserId: existing.createdByUserId,
      updatedByUserId: input.userId,
      number: input.number,
      status: input.status ?? existing.status,
      issuedAt: input.issuedAt,
      validUntil: input.validUntil,
      sellerName: input.sellerName,
      sellerDocument: input.sellerDocument,
      sellerEmail: input.sellerEmail,
      sellerPhone: input.sellerPhone,
      sellerAddress: input.sellerAddress,
      customerLegalName: customer.legalName,
      customerTradeName: customer.tradeName,
      customerDocument: customer.document,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress:
        input.customerAddress ??
        customer.billingAddress ??
        customer.deliveryAddress,
      paymentTerms: input.paymentTerms,
      deliveryTerms: input.deliveryTerms,
      notes: input.notes,
      internalNotes: input.internalNotes,
      ...totals,
      items: input.items.map((item, index) => {
        const product = productsById.get(item.productId)!;
        const existingItem = item.id
          ? existingItemsById.get(item.id)
          : undefined;

        return new QuotationItem({
          id: item.id ?? randomUUID(),
          entityId: input.entityId,
          quotationId: existing.id,
          productId: item.productId,
          lineNumber: item.lineNumber,
          productCode: product.code,
          description: product.name,
          brand: product.brand,
          specification: product.specification,
          unit: product.packaging,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: totals.itemTotals[index],
          notes: item.notes,
          images: existingItem?.images,
          createdAt: existingItem?.createdAt,
        });
      }),
      createdAt: existing.createdAt,
    });

    const retainedItemIds = new Set(
      input.items.flatMap((item) => (item.id ? [item.id] : []))
    );
    const obsoleteStorageKeys = existing.items
      .filter((item) => !retainedItemIds.has(item.id))
      .flatMap((item) => item.images.map((image) => image.storageKey));
    const updated = await this.quotationRepository.update(quotation);

    await Promise.allSettled(
      obsoleteStorageKeys.map((key) => this.storageService.delete(key))
    );

    return this.quotationViewService.build(updated);
  }
}

export namespace UpdateQuotationUseCase {
  export type Input = {
    entityId: string;
    quotationId: string;
    userId: string;
    customerId: string;
    number: string;
    status?: Quotation.Status;
    issuedAt: Date;
    validUntil?: Date;
    sellerName: string;
    sellerDocument?: string;
    sellerEmail?: string;
    sellerPhone?: string;
    sellerAddress?: string;
    customerAddress?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    notes?: string;
    internalNotes?: string;
    freight?: number;
    discount?: number;
    items: Array<{
      id?: string;
      productId: string;
      lineNumber: number;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
  };
}
