import "reflect-metadata";
import { UploadQuotationImageController } from "@application/controllers/quotations/UploadQuotationImageController";
import { lambdaHttpAdapter } from "@main/adapters/lambdaHttpAdapter";

export const handler = lambdaHttpAdapter(UploadQuotationImageController);
