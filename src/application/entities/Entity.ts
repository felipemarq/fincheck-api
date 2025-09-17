export class Entity {
  readonly id?: string;
  readonly ownerUserId: string;
  readonly name: string;
  readonly type: Entity.Type;
  readonly color?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(attr: Entity.Attributes) {
    this.id = attr.id;
    this.ownerUserId = attr.ownerUserId;
    this.name = attr.name;
    this.type = attr.type ?? Entity.Type.PF;
    this.color = attr.color;
    this.createdAt = attr.createdAt;
    this.updatedAt = attr.updatedAt;
  }
}

export namespace Entity {
  export type Attributes = {
    id?: string;
    ownerUserId: string;
    name: string;
    type?: Entity.Type;
    createdAt?: Date;
    updatedAt?: Date;
    color?: string;
  };

  export enum Type {
    PF = "PF",
    PJ = "PJ",
  }
}
