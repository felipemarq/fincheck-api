import { Controller } from "@application/contracts/Controller";
import { Entity } from "@application/entities/Entity";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { CreateEntityUseCase } from "@application/useCases/entities/CreateEntityUseCase";

import {
  CreateEntityBody,
  createEntitySchema,
} from "./schemas/createEntitySchema";

@Injectable()
@Schema(createEntitySchema)
export class CreateEntityController extends Controller<
  "private",
  CreateEntityController.Response
> {
  constructor(private readonly createEntityUseCase: CreateEntityUseCase) {
    super();
  }

  protected override async handle({
    body,
    userId,
  }: Controller.Request<"private", CreateEntityBody>) {
    const entity = await this.createEntityUseCase.execute({
      userId,
      ...body,
    });

    return {
      statusCode: 201,
      body: { entity },
    };
  }
}

export namespace CreateEntityController {
  export type Response = {
    entity: Entity;
  };
}
