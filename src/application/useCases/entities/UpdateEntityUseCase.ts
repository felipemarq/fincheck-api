import { Entity } from "@application/entities/Entity";
import { UnauthorizedException } from "@application/errors/http/UnauthorizedException";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdateEntityUseCase {
  constructor(private readonly entityRepository: EntityRepository) {}

  async execute({
    entityId,
    userId,
    name,
    type,
    color,
  }: UpdateEntityUseCase.Input): Promise<UpdateEntityUseCase.Output> {
    const entity = await this.entityRepository.findByUserId({
      userId,
      entityId,
    });

    if (!entity) {
      throw new UnauthorizedException(
        "Usuário não tem permissão para editar essa entidade."
      );
    }

    const updatedEntity = new Entity({
      ...entity,
      name: name ?? entity.name,
      type: type ?? entity.type,
      color: color ?? entity.color,
    });

    return this.entityRepository.update(entityId, updatedEntity);
  }
}

export namespace UpdateEntityUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    name?: string;
    type?: Entity.Type;
    color?: string;
  };

  export type Output = Entity;
}
