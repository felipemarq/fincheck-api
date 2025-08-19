import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";

import { SignUpUseCase } from "@application/useCases/auth/SignUpUseCase";

import { Controller } from "@application/contracts/Controller";
import { SignUpBody, signUpSchema } from "./schemas/signUpSchema";

@Injectable()
@Schema(signUpSchema)
export class SignUpController extends Controller<
  "public",
  SignUpController.Response
> {
  constructor(private readonly signUpUseCase: SignUpUseCase) {
    super();
  }

  protected override async handle({
    body,
  }: Controller.Request<"public", SignUpBody>): Promise<
    Controller.Response<SignUpController.Response>
  > {
    const { email, name, password } = body;

    const { accessToken, refreshToken } = await this.signUpUseCase.execute({
      email,
      name,
      password,
    });

    return {
      statusCode: 201,
      body: {
        accessToken,
        refreshToken,
      },
    };
  }
}

export namespace SignUpController {
  export type Response = {
    accessToken: string;
    refreshToken: string;
  };
}
