import { Customer } from "@application/entities/Customer";
import type { CustomerRow, NewCustomerRow } from "../schema";

export class CustomerItem {
  static fromRow(row: CustomerRow): Customer {
    return new Customer({
      id: row.id,
      entityId: row.entityId,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      legalName: row.legalName,
      tradeName: row.tradeName ?? undefined,
      document: row.document,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      billingAddress: row.billingAddress ?? undefined,
      deliveryAddress: row.deliveryAddress ?? undefined,
      notes: row.notes ?? undefined,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toRow(customer: Customer): NewCustomerRow {
    return {
      id: customer.id,
      entityId: customer.entityId,
      createdByUserId: customer.createdByUserId,
      updatedByUserId: customer.updatedByUserId,
      legalName: customer.legalName,
      tradeName: customer.tradeName ?? null,
      document: customer.document,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      billingAddress: customer.billingAddress ?? null,
      deliveryAddress: customer.deliveryAddress ?? null,
      notes: customer.notes ?? null,
      active: customer.active,
    };
  }
}
