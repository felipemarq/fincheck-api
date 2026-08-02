import { Entity } from "@application/entities/Entity";
import { User } from "@application/entities/User";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { ConflictException } from "@application/errors/http/ConflictException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { UserRepository } from "@infra/database/neon/repositories/UserRepository";
import { AuthGateway } from "@infra/gateways/AuthGateway";
import { Injectable } from "@kernel/decorators/Injectable";
import { Saga } from "@shared/saga/saga";

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly userRepository: UserRepository,
    private readonly entityRepository: EntityRepository,
    private readonly saga: Saga
  ) {}

  async execute({
    email,
    name,
    password,
  }: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
    return this.saga.run(async () => {
      const userAlreadyExists = await this.userRepository.findByEmail(email);

      if (userAlreadyExists) {
        throw new ConflictException("Este email já está cadastrado.");
      }

      const user = new User({ email, name });
      const pendingUser = await this.userRepository.create(user);

      if (!pendingUser) {
        throw new BadRequestException("Erro ao criar usuário");
      }

      // Roll back the local user and its cascaded entities if any
      // subsequent step in the signup pipeline fails.
      this.saga.addCompensation(() =>
        this.userRepository.delete(pendingUser.id)
      );

      const entity = new Entity({
        name: pendingUser.name,
        ownerUserId: pendingUser.id,
      });

      const createdEntity = await this.entityRepository.create(entity);

      const { externalId } = await this.authGateway.signUp({
        email,
        password,
        internalId: pendingUser.id,
      });

      this.saga.addCompensation(() =>
        this.authGateway.deleteUser({ externalId })
      );

      await this.userRepository.setExternalId(externalId, pendingUser.id);

      const { accessToken, refreshToken } = await this.authGateway.signIn({
        email,
        password,
      });

      return { accessToken, refreshToken };
    });
  }
}

export namespace SignUpUseCase {
  export type Input = { email: string; password: string; name: string };
  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
