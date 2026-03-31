import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { ContactRepository } from "@infra/database/neon/repositories/ContactRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class DeleteContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    contactId,
    entityId,
    userId,
  }: DeleteContactUseCase.Input): Promise<DeleteContactUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para excluir contatos nessa entidade."
      );
    }

    const contactExists = await this.contactRepository.findOne({
      contactId,
      entityId,
      userId,
    });

    if (!contactExists) {
      throw new UnauthorizedException("Contato não encontrado para exclusão.");
    }

    await this.contactRepository.delete({
      contactId,
      entityId,
      userId,
    });

    return { statusCode: 204 };
  }
}

export namespace DeleteContactUseCase {
  export type Input = {
    contactId: string;
    entityId: string;
    userId: string;
  };

  export type Output = {
    statusCode: number;
  };
}
