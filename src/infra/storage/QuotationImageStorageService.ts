import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@kernel/decorators/Injectable";
import { AppConfig } from "@shared/config/AppConfig";

@Injectable()
export class QuotationImageStorageService {
  private readonly client = new S3Client({});
  private readonly bucket: string;

  constructor(config: AppConfig) {
    if (!config.files.quotationImagesBucket) {
      throw new Error("QUOTATION_IMAGES_BUCKET nao configurado.");
    }

    this.bucket = config.files.quotationImagesBucket;
  }

  async upload({
    key,
    contentType,
    body,
  }: {
    key: string;
    contentType: string;
    body: Uint8Array;
  }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "private, max-age=3600",
      })
    );
  }

  async getReadUrl(key: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 15 * 60 }
    );
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}
