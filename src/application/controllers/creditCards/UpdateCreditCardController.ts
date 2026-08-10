import { Controller } from "@application/contracts/Controller";
import { CreditCard } from "@application/entities/CreditCard";
import { UpdateCreditCardUseCase } from "@application/useCases/creditCards/UpdateCreditCardUseCase";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { CreditCardParams, creditCardParamsSchema, UpdateCreditCardBody, updateCreditCardSchema } from "./schemas/creditCardSchemas";

@Injectable()
@Schema(updateCreditCardSchema)
export class UpdateCreditCardController extends Controller<"private", UpdateCreditCardController.Response> {
  constructor(private readonly useCase: UpdateCreditCardUseCase) { super(); }

  protected override async handle({ userId, body, params }: Controller.Request<"private", UpdateCreditCardBody, CreditCardParams>) {
    const route = creditCardParamsSchema.parse(params);
    const creditCard = await this.useCase.execute({ ...body, ...route, userId });
    return { statusCode: 200, body: { creditCard } };
  }
}

export namespace UpdateCreditCardController {
  export type Response = { creditCard: CreditCard };
}
