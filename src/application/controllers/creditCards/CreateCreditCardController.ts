import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  CreateCreditCardBody,
  createCreditCardSchema,
} from "./schemas/createCreditCardSchema";
import { CreditCard } from "@application/entities/CreditCard";
import { CreateCreditCardUseCase } from "@application/useCases/creditCards/CreateCreditCardUseCase";

@Injectable()
@Schema(createCreditCardSchema)
export class CreateCreditCardController extends Controller<
  "private",
  CreateCreditCardController.Response
> {
  constructor(
    private readonly createCreditCardUseCase: CreateCreditCardUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
  }: Controller.Request<"private", CreateCreditCardBody>): Promise<
    Controller.Response<CreateCreditCardController.Response>
  > {
    const creditCard = await this.createCreditCardUseCase.execute({
      userId,
      ...body,
    });

    return {
      statusCode: 201,
      body: {
        creditCard,
      },
    };
  }
}

export namespace CreateCreditCardController {
  export type Response = {
    creditCard: CreditCard;
  };
}
