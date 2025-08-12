import { Account } from "@aplication/entities/Account";
import { EmailAlreadyInUse } from "@aplication/errors/application/EmailAlreadyInUse";
import { InvalidCredentials } from "@aplication/errors/application/InvalidCredentials";
import { AccountRepository } from "@infra/database/dynamo/repositories/AccountRepository";
import { AuthGateway } from "@infra/gateways/AuthGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class SignInUseCase {
  constructor(private readonly authGateway: AuthGateway) {}
  async execute({
    email,
    password,
  }: SignInUseCase.Input): Promise<SignInUseCase.Output> {
    try {
      const { accessToken, refreshToken } = await this.authGateway.signIn({
        email,
        password,
      });
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new InvalidCredentials();
    }
  }
}

export namespace SignInUseCase {
  export type Input = {
    email: string;
    password: string;
  };
  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
