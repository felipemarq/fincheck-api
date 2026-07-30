import { ForbiddenException } from "@application/errors/http/ForbiddenException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly entityRepository: EntityRepository) {}

  async assertUserAccess(entityId: string, userId: string): Promise<void> {
    const entity = await this.entityRepository.findByUserId({
      entityId,
      userId,
    });

    if (!entity) {
      throw new ForbiddenException(
        "Usuario nao possui acesso a esta organizacao."
      );
    }
  }
}
