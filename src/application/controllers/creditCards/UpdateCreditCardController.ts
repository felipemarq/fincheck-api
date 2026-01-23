import { Schema } from "@kernel/decorators/Schema";
import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  UpdateCreditCardBody,
  updateCreditCardSchema,
} from "./schemas/updateCreditCardSchema";
import {
  UpdateCreditCardParams,
  updateCreditCardParamsSchema,
} from "./schemas/updateCreditCardParamsSchema";
import { CreditCard } from "@application/entities/CreditCard";
import { UpdateCreditCardUseCase } from "@application/useCases/creditCards/UpdateCreditCardUseCase";

@Injectable()
@Schema(updateCreditCardSchema)
export class UpdateCreditCardController extends Controller<
  "private",
  UpdateCreditCardController.Response
> {
  constructor(
    private readonly updateCreditCardUseCase: UpdateCreditCardUseCase
  ) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<
    "private",
    UpdateCreditCardBody,
    UpdateCreditCardParams
  >): Promise<Controller.Response<UpdateCreditCardController.Response>> {
    const updateParams = updateCreditCardParamsSchema.parse(params);
    const creditCard = await this.updateCreditCardUseCase.execute({
      id: updateParams.creditCardId,
      ...body,
      userId,
    });

    return {
      statusCode: 200,
      body: {
        creditCard,
      },
    };
  }
}

export namespace UpdateCreditCardController {
  export type Response = {
    creditCard: CreditCard;
  };
}
