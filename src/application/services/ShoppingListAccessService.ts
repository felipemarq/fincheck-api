import { ForbiddenException } from "@application/errors/http/ForbiddenException";
import { DatabaseService } from "@infra/database/neon";
import { Injectable } from "@kernel/decorators/Injectable";
import { sql } from "drizzle-orm";

/** Uses the deployed team's roles while remaining compatible with the V2 baseline. */
@Injectable()
export class ShoppingListAccessService {
  constructor(private readonly database: DatabaseService) {}

  async assertAccess(entityId: string, userId: string, action: "read" | "edit" | "purchase") {
    const tables = await this.database.db.execute(sql`select to_regclass('public.entity_memberships') as memberships`);
    const result = tables.rows[0]?.memberships
      ? await this.database.db.execute(sql`
          select case when e.owner_user_id = ${userId}::uuid then 'OWNER' else m.role::text end as role
          from entities e left join entity_memberships m on m.entity_id = e.id
            and m.user_id = ${userId}::uuid and m.status = 'ACTIVE'
          where e.id = ${entityId}::uuid and (e.owner_user_id = ${userId}::uuid or m.id is not null)`)
      : await this.database.db.execute(sql`select 'OWNER' as role from entities where id = ${entityId}::uuid and owner_user_id = ${userId}::uuid`);
    const role = result.rows[0]?.role as string | undefined;
    const allowed = action === "read"
      ? ["OWNER", "ADMIN", "COMMERCIAL", "OPERATIONS", "FINANCE", "VIEWER"]
      : action === "edit" ? ["OWNER", "ADMIN", "COMMERCIAL", "OPERATIONS"] : ["OWNER", "ADMIN", "OPERATIONS"];
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException("Você não possui permissão para esta ação na lista de compras.");
    }
  }
}
