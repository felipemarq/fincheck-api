import { Schema } from "@kernel/decorators/Schema";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ConfirmForgotPasswordBody,
  confirmForgotPasswordSchema,
} from "./schemas/confirmForgotPasswordSchema";
import { Controller } from "@application/contracts/Controller";
import { ConfirmForgotPasswordUseCase } from "@application/useCases/auth/ConfirmForgotPasswordUseCase";

@Injectable()
@Schema(confirmForgotPasswordSchema)
export class ConfirmForgotPasswordController extends Controller<
  "public",
  ConfirmForgotPasswordController.Response
> {
  constructor(
    private readonly confirmForgotPasswordUseCase: ConfirmForgotPasswordUseCase
  ) {
    super();
  }

  protected override async handle({
    body,
  }: Controller.Request<"public", ConfirmForgotPasswordBody>): Promise<
    Controller.Response<ConfirmForgotPasswordController.Response>
  > {
    const { email, confirmationCode, password } = body;

    await this.confirmForgotPasswordUseCase.execute({
      email,
      confirmationCode,
      password,
    });
    return {
      statusCode: 204,
    };
  }
}

export namespace ConfirmForgotPasswordController {
  export type Response = null;
}
