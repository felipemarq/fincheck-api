import { PersonalFeature } from "./PersonalFeature";

export class User {
  readonly email: string;
  readonly name: string;
  readonly features: PersonalFeature[];
  externalId: string | undefined;

  constructor(attr: User.Attributes) {
    this.email = attr.email;
    this.name = attr.name;
    this.externalId = attr.externalId;
    this.features = attr.features ?? [];
  }
}

export namespace User {
  export type Attributes = {
    email: string;
    name: string;
    externalId?: string;
    features?: PersonalFeature[];
  };
}
