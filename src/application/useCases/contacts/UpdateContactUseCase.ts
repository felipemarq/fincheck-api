import { Contact } from "@application/entities/Contact";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { ContactRepository } from "@infra/database/neon/repositories/ContactRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly entityRepository: EntityRepository
  ) {}

  async execute({
    id,
    entityId,
    userId,
    name,
    email,
    phone,
  }: UpdateContactUseCase.Input): Promise<UpdateContactUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar contatos nessa entidade."
      );
    }

    const contactExists = await this.contactRepository.findOne({
      contactId: id,
      entityId,
      userId,
    });

    if (!contactExists) {
      throw new UnauthorizedException("Contato não encontrado para edição.");
    }

    const contact = new Contact({
      ...contactExists,
      name: name ?? contactExists.name,
      email: email ?? contactExists.email,
      phone: phone ?? contactExists.phone,
    });

    return this.contactRepository.update(id, contact);
  }
}

export namespace UpdateContactUseCase {
  export type Input = {
    id: string;
    entityId: string;
    userId: string;
    name?: string;
    email?: string;
    phone?: string;
  };

  export type Output = Contact;
}
