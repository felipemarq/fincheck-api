export class User {
  readonly email: string;
  readonly name: string;
  externalId: string | undefined;

  constructor(attr: User.Attributes) {
    this.email = attr.email;
    this.name = attr.name;
    this.externalId = attr.externalId;
  }
}

export namespace User {
  export type Attributes = {
    email: string;
    name: string;
    externalId?: string;
  };
}
