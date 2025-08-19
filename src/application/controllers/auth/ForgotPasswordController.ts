import { Schema } from "@kernel/decorators/Schema";
import { Injectable } from "@kernel/decorators/Injectable";
import { Controller } from "@application/contracts/Controller";
import {
  ForgotPasswordBody,
  forgotPasswordSchema,
} from "./schemas/forgotPasswordSchema";
import { ForgotPasswordUseCase } from "@application/useCases/auth/ForgotPasswordUseCase";
import { BadRequestException } from "@application/errors/http/BadRequestException";

@Injectable()
@Schema(forgotPasswordSchema)
export class ForgotPasswordController extends Controller<
  "public",
  ForgotPasswordController.Response
> {
  constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {
    super();
  }

  protected override async handle({
    body,
  }: Controller.Request<"public", ForgotPasswordBody>): Promise<
    Controller.Response<ForgotPasswordController.Response>
  > {
    try {
      const { email } = body;

      await this.forgotPasswordUseCase.execute({
        email,
      });
      return {
        statusCode: 204,
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}

export namespace ForgotPasswordController {
  export type Response = null;
}
