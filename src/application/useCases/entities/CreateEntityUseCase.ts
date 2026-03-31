import { Entity } from "@application/entities/Entity";
import { CategoryRepository } from "@infra/database/neon/repositories/CategoryRepository";
import { EntityRepository } from "@infra/database/neon/repositories/EntityRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateEntityUseCase {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

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

    const createdEntity = await this.entityRepository.create(entity);

    try {
      await this.categoryRepository.seedDefault({
        entityId: createdEntity.id!,
        userId,
      });
    } catch (error) {
      await this.entityRepository.delete(createdEntity.id!);
      throw error;
    }

    return createdEntity;
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
