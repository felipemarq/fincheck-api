import { Contact } from "@application/entities/Contact";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { ContactRepository } from "@infra/database/neon/repositories/ContactRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    entityId,
    userId,
    name,
    email,
    phone,
  }: CreateContactUseCase.Input): Promise<CreateContactUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para criar contatos nessa entidade."
      );
    }

    const contact = new Contact({
      entityId,
      userId,
      name,
      email,
      phone,
    });

    return this.contactRepository.create(contact);
  }
}

export namespace CreateContactUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
  };

  export type Output = Contact;
}
