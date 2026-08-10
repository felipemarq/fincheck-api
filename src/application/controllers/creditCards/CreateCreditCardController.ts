import { Controller } from "@application/contracts/Controller";
import { organizationParamsSchema, OrganizationParams } from "@application/controllers/v2Schemas";
import { CreditCard } from "@application/entities/CreditCard";
import { CreateCreditCardUseCase } from "@application/useCases/creditCards/CreateCreditCardUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { CreateCreditCardBody, createCreditCardSchema } from "./schemas/creditCardSchemas";

@Injectable()
@Schema(createCreditCardSchema)
export class CreateCreditCardController extends Controller<"private", CreateCreditCardController.Response> {
  constructor(private readonly useCase: CreateCreditCardUseCase) { super(); }

  protected override async handle({ userId, body, params }: Controller.Request<"private", CreateCreditCardBody, OrganizationParams>) {
    const { entityId } = organizationParamsSchema.parse(params);
    const creditCard = await this.useCase.execute({ ...body, entityId, userId });
    return { statusCode: 201, body: { creditCard } };
  }
}

export namespace CreateCreditCardController {
  export type Response = { creditCard: CreditCard };
}
