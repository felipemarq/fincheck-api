export class Contact {
  readonly id?: string;
  readonly entityId: string;
  readonly userId: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: Contact.Attributes) {
    this.id = attr.id;
    this.entityId = attr.entityId;
    this.userId = attr.userId;
    this.name = attr.name;
    this.email = attr.email;
    this.phone = attr.phone;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
  }
}

export namespace Contact {
  export type Attributes = {
    id?: string;
    entityId: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}
