import { Contact } from "@application/entities/Contact";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { ContactRepository } from "@infra/database/neon/repositories/ContactRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class ListContactsUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    userId,
  }: ListContactsUseCase.Input): Promise<ListContactsUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para listar contatos nessa entidade."
      );
    }

    const contacts = await this.contactRepository.listAll({ entityId, userId });

    return { contacts };
  }
}

export namespace ListContactsUseCase {
  export type Input = {
    entityId: string;
    userId: string;
  };

  export type Output = {
    contacts: Contact[];
  };
}
