import { Schema } from "@kernel/decorators/Schema";
import { Injectable } from "@kernel/decorators/Injectable";
import {
  ConfirmForgotPasswordBody,
  confirmForgotPasswordSchema,
} from "./schemas/confirmForgotPasswordSchema";
import { Controller } from "@application/contracts/Controller";
import { ConfirmForgotPasswordUseCase } from "@application/useCases/auth/ConfirmForgotPasswordUseCase";
import { BadRequestException } from "@application/errors/http/BadRequestException";

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
    try {
      const { email, confirmationCode, password } = body;

      await this.confirmForgotPasswordUseCase.execute({
        email,
        confirmationCode,
        password,
      });
      return {
        statusCode: 204,
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}

export namespace ConfirmForgotPasswordController {
  export type Response = null;
}
