import { Injectable } from "@kernel/decorators/Injectable";
import { DatabaseService } from "..";
import { entitiesTable } from "../schema";
import { and, eq } from "drizzle-orm";
import { Entity } from "@application/entities/Entity";

@Injectable()
export class EntityRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private mapRowToEntity(row: typeof entitiesTable.$inferSelect): Entity {
    return new Entity({
      id: row.id,
      ownerUserId: row.ownerUserId,
      name: row.name,
      type: row.type as Entity.Type,
      color: row.color,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(entity: Entity): Promise<Entity> {
    const { name, ownerUserId, type, color } = entity;
    const [entityCreated] = await this.databaseService.db
      .insert(entitiesTable)
      .values({ name, ownerUserId, type, color })
      .returning();

    return this.mapRowToEntity(entityCreated);
  }

  async findByUserId({
    userId,
    entityId,
  }: {
    userId: string;
    entityId: string;
  }): Promise<Entity | null> {
    const [entity] = await this.databaseService.db
      .select()
      .from(entitiesTable)
      .where(
        and(
          eq(entitiesTable.ownerUserId, userId),
          eq(entitiesTable.id, entityId)
        )
      );

    return entity ? this.mapRowToEntity(entity) : null;
  }

  async update(entityId: string, entity: Entity): Promise<Entity> {
    const [updatedEntity] = await this.databaseService.db
      .update(entitiesTable)
      .set({
        name: entity.name,
        type: entity.type,
        color: entity.color,
        updatedAt: new Date(),
      })
      .where(eq(entitiesTable.id, entityId))
      .returning();

    return this.mapRowToEntity(updatedEntity);
  }

  async delete(entityId: string) {
    await this.databaseService.db
      .delete(entitiesTable)
      .where(eq(entitiesTable.id, entityId));
  }
}
