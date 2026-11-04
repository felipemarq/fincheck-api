import { ForbiddenException } from "@application/errors/http/ForbiddenException";
import { DatabaseService } from "@infra/database/neon";
import { Injectable } from "@kernel/decorators/Injectable";
import { sql } from "drizzle-orm";

export type FinancialPermission =
  | "invoices.read"
  | "invoices.manage"
  | "payments.manage"
  | "finance.read"
  | "dashboard.read";

/** Mirrors the financial permissions verified in the deployed SaaS API (2026-11-03). */
@Injectable()
export class FinancialAccessService {
  constructor(private readonly database: DatabaseService) {}

  async assertUserAccess(
    entityId: string,
    userId: string,
    permission: FinancialPermission = "invoices.read",
  ): Promise<void> {
    const tables = await this.database.db.execute(
      sql`select to_regclass('public.entity_memberships') as memberships`,
    );
    const result = tables.rows[0]?.memberships
      ? await this.database.db
          .execute(sql`select role::text as role from entity_memberships
          where entity_id = ${entityId}::uuid and user_id = ${userId}::uuid and status = 'ACTIVE'`)
      : await this.database.db.execute(sql`select 'OWNER' as role from entities
          where id = ${entityId}::uuid and owner_user_id = ${userId}::uuid`);
    const role = result.rows[0]?.role as string | undefined;
    const allowed =
      permission === "invoices.manage" || permission === "payments.manage"
        ? ["OWNER", "ADMIN", "FINANCE"]
        : permission === "finance.read"
          ? ["OWNER", "ADMIN", "FINANCE", "VIEWER"]
          : ["OWNER", "ADMIN", "COMMERCIAL", "OPERATIONS", "FINANCE", "VIEWER"];
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException(
        "Seu perfil nesta organizacao nao permite esta acao.",
      );
    }
  }
}
