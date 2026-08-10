import { QuotationItemImage } from "@application/entities/Quotation";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { QuotationImageView } from "@application/queries/types/QuotationView";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { QuotationRepository } from "@infra/database/neon/repositories/QuotationRepository";
import { QuotationImageStorageService } from "@infra/storage/QuotationImageStorageService";
import { Injectable } from "@kernel/decorators/Injectable";
import { randomUUID } from "node:crypto";

const MAX_IMAGES_PER_ITEM = 3;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class UploadQuotationImageUseCase {
  constructor(
    private readonly repository: QuotationRepository,
    private readonly storageService: QuotationImageStorageService,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(
    input: UploadQuotationImageUseCase.Input
  ): Promise<QuotationImageView> {
    await this.organizationAccessService.assertUserAccess(
      input.entityId,
      input.userId
    );

    const extension = EXTENSIONS[input.contentType];
    if (!extension) {
      throw new BadRequestException(
        "A imagem deve estar nos formatos JPEG, PNG ou WEBP."
      );
    }

    const [item, imageCount] = await Promise.all([
      this.repository.findItem(input),
      this.repository.countImages(input.quotationItemId),
    ]);
    if (!item) throw new NotFoundException("Item da cotacao nao encontrado.");
    if (imageCount >= MAX_IMAGES_PER_ITEM) {
      throw new BadRequestException(
        `Cada item pode possuir no maximo ${MAX_IMAGES_PER_ITEM} imagens.`
      );
    }

    const normalizedBase64 = input.dataBase64.replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
      throw new BadRequestException("Conteudo de imagem invalido.");
    }
    const body = Buffer.from(normalizedBase64, "base64");
    if (!body.length || body.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException("Cada imagem deve possuir no maximo 3 MB.");
    }

    const imageId = randomUUID();
    const storageKey = [
      "entities",
      input.entityId,
      "quotations",
      input.quotationId,
      "items",
      input.quotationItemId,
      `${imageId}.${extension}`,
    ].join("/");
    const image = new QuotationItemImage({
      id: imageId,
      entityId: input.entityId,
      quotationId: input.quotationId,
      quotationItemId: input.quotationItemId,
      storageKey,
      fileName: input.fileName,
      contentType: input.contentType,
      size: body.length,
      sortOrder: imageCount,
    });

    await this.storageService.upload({
      key: storageKey,
      contentType: input.contentType,
      body,
    });

    try {
      const created = await this.repository.addImage(image);
      const { storageKey: _storageKey, ...metadata } = created;
      return {
        ...metadata,
        url: await this.storageService.getReadUrl(storageKey),
      };
    } catch (error) {
      await this.storageService.delete(storageKey);
      throw error;
    }
  }
}

export namespace UploadQuotationImageUseCase {
  export type Input = {
    entityId: string;
    quotationId: string;
    quotationItemId: string;
    userId: string;
    fileName: string;
    contentType: string;
    dataBase64: string;
  };
}
