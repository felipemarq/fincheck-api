import { Entity } from "@application/entities/Entity";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateEntityUseCase {
  constructor(private readonly entityRepository: EntityRepository) {}

  async execute({
    userId,
    name,
    type,
    color,
  }: CreateEntityUseCase.Input): Promise<CreateEntityUseCase.Output> {
    const entity = new Entity({
      ownerUserId: userId,
      name,
      type,
      color,
    });

    return this.entityRepository.create(entity);
  }
}

export namespace CreateEntityUseCase {
  export type Input = {
    userId: string;
    name: string;
    type: Entity.Type;
    color?: string;
  };

  export type Output = Entity;
}
