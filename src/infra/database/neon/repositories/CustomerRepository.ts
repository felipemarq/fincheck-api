import { Customer } from "@application/entities/Customer";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

import { DatabaseService } from "..";
import { CustomerItem } from "../items/CustomerItem";
import { customersTable } from "../schema";

@Injectable()
export class CustomerRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(customer: Customer): Promise<Customer> {
    const [created] = await this.databaseService.db
      .insert(customersTable)
      .values(CustomerItem.toRow(customer))
      .returning();

    return CustomerItem.fromRow(created);
  }

  async listAll({
    entityId,
    search,
    active,
  }: {
    entityId: string;
    search?: string;
    active?: boolean;
  }): Promise<Customer[]> {
    const conditions = [eq(customersTable.entityId, entityId)];

    if (search) {
      conditions.push(
        or(
          ilike(customersTable.legalName, `%${search}%`),
          ilike(customersTable.tradeName, `%${search}%`),
          ilike(customersTable.document, `%${search}%`)
        )!
      );
    }

    if (active !== undefined) {
      conditions.push(eq(customersTable.active, active));
    }

    const rows = await this.databaseService.db
      .select()
      .from(customersTable)
      .where(and(...conditions))
      .orderBy(desc(customersTable.active), asc(customersTable.legalName));

    return rows.map(CustomerItem.fromRow);
  }

  async findOne({
    customerId,
    entityId,
  }: {
    customerId: string;
    entityId: string;
  }): Promise<Customer | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, customerId),
          eq(customersTable.entityId, entityId)
        )
      )
      .limit(1);

    return row ? CustomerItem.fromRow(row) : null;
  }

  async findByDocument({
    document,
    entityId,
  }: {
    document: string;
    entityId: string;
  }): Promise<Customer | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.document, document),
          eq(customersTable.entityId, entityId)
        )
      )
      .limit(1);

    return row ? CustomerItem.fromRow(row) : null;
  }

  async update(customer: Customer): Promise<Customer> {
    const { id: _id, ...values } = CustomerItem.toRow(customer);
    const [updated] = await this.databaseService.db
      .update(customersTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customersTable.id, customer.id!),
          eq(customersTable.entityId, customer.entityId)
        )
      )
      .returning();

    return CustomerItem.fromRow(updated);
  }
}
