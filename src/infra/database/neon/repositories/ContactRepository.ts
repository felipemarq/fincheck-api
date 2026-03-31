import { Contact } from "@application/entities/Contact";
import { Injectable } from "@kernel/decorators/Injectable";
import { and, asc, eq } from "drizzle-orm";

import { DatabaseService } from "..";
import { ContactItem } from "../items/ContactItem";
import { contactsTable } from "../schema";

@Injectable()
export class ContactRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(contact: Contact): Promise<Contact> {
    const rowToInsert = ContactItem.toRow(contact);

    const [created] = await this.databaseService.db
      .insert(contactsTable)
      .values(rowToInsert)
      .returning();

    return ContactItem.fromRow(created);
  }

  async listAll({
    entityId,
    userId,
  }: {
    entityId: string;
    userId: string;
  }): Promise<Contact[]> {
    const rows = await this.databaseService.db
      .select()
      .from(contactsTable)
      .where(
        and(
          eq(contactsTable.entityId, entityId),
          eq(contactsTable.userId, userId)
        )
      )
      .orderBy(asc(contactsTable.name));

    return rows.map(ContactItem.fromRow);
  }

  async findOne({
    contactId,
    entityId,
    userId,
  }: {
    contactId: string;
    entityId: string;
    userId: string;
  }): Promise<Contact | null> {
    const [row] = await this.databaseService.db
      .select()
      .from(contactsTable)
      .where(
        and(
          eq(contactsTable.id, contactId),
          eq(contactsTable.entityId, entityId),
          eq(contactsTable.userId, userId)
        )
      )
      .limit(1);

    return row ? ContactItem.fromRow(row) : null;
  }

  async update(contactId: string, contact: Contact): Promise<Contact> {
    const rowToUpdate = {
      ...ContactItem.toRow(contact),
      updatedAt: new Date(),
    };

    const [updated] = await this.databaseService.db
      .update(contactsTable)
      .set(rowToUpdate)
      .where(eq(contactsTable.id, contactId))
      .returning();

    return ContactItem.fromRow(updated);
  }

  async delete({
    contactId,
    entityId,
    userId,
  }: {
    contactId: string;
    entityId: string;
    userId: string;
  }): Promise<void> {
    await this.databaseService.db
      .delete(contactsTable)
      .where(
        and(
          eq(contactsTable.id, contactId),
          eq(contactsTable.entityId, entityId),
          eq(contactsTable.userId, userId)
        )
      );
  }
}
