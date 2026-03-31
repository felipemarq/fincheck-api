import { Controller } from "@application/contracts/Controller";
import { Entity } from "@application/entities/Entity";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { UpdateEntityUseCase } from "@application/useCases/entities/UpdateEntityUseCase";

import { EntityParams, entityParamsSchema } from "./schemas/entityParamsSchema";
import {
  UpdateEntityBody,
  updateEntitySchema,
} from "./schemas/updateEntitySchema";

@Injectable()
@Schema(updateEntitySchema)
export class UpdateEntityController extends Controller<
  "private",
  UpdateEntityController.Response
> {
  constructor(private readonly updateEntityUseCase: UpdateEntityUseCase) {
    super();
  }

  protected override async handle({
    body,
    params,
    userId,
  }: Controller.Request<"private", UpdateEntityBody, EntityParams>) {
    const parsedParams = entityParamsSchema.parse(params);

    const entity = await this.updateEntityUseCase.execute({
      entityId: parsedParams.entityId,
      userId,
      ...body,
    });

    return {
      statusCode: 200,
      body: { entity },
    };
  }
}

export namespace UpdateEntityController {
  export type Response = {
    entity: Entity;
  };
}
