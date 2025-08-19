import { User } from "@application/entities/User";
import { ConflictException } from "@application/errors/http/ConflictException";
import { UserRepository } from "@infra/database/neon/repositories/UserRepository";
import { AuthGateway } from "@infra/gateways/AuthGateway";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly userRepository: UserRepository
  ) {}
  async execute({
    email,
    name,
    password,
  }: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
    const userAlreadyExists = await this.userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new ConflictException("Este email já está cadastrado.");
    }
    const user = new User({ email, name });

    const pendingUser = await this.userRepository.create(user);

    const { externalId } = await this.authGateway.signUp({
      email,
      password,
      internalId: pendingUser.id,
    });

    await this.userRepository.setExternalId(externalId, pendingUser.id);

    const { accessToken, refreshToken } = await this.authGateway.signIn({
      email,
      password,
    });
    return { accessToken, refreshToken };
  }
}

export namespace SignUpUseCase {
  export type Input = { email: string; password: string; name: string };
  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
