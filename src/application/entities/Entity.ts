export class Entity {
  readonly id?: string;
  readonly ownerUserId: string;
  readonly name: string;
  readonly type: Entity.Type;

  constructor(attr: Entity.Attributes) {
    this.id = attr.id;
    this.ownerUserId = attr.ownerUserId;
    this.name = attr.name;
    this.type = attr.type ?? Entity.Type.PF;
  }
}

export namespace Entity {
  export type Attributes = {
    id?: string;
    ownerUserId: string;
    name: string;
    type?: Entity.Type;
  };

  export enum Type {
    PF = "PF",
    PJ = "PJ",
  }
}
