import { Contact } from "@application/entities/Contact";
import { ContactRow, NewContactRow } from "../schema";

export class ContactItem {
  static fromRow(row: ContactRow): Contact {
    return new Contact({
      id: row.id,
      entityId: row.entityId,
      userId: row.userId,
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    });
  }

  static toRow(contact: Contact): NewContactRow {
    return {
      id: contact.id,
      entityId: contact.entityId,
      userId: contact.userId,
      name: contact.name,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}
