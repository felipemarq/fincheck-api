import { Controller } from "@application/contracts/Controller";
import { Entity } from "@application/entities/Entity";
import { User } from "@application/entities/User";
import { GetMeQuery } from "@application/queries/GetMeQuery";

import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class GetMeController extends Controller<
  "private",
  GetMeController.Response
> {
  constructor(private readonly getMeQuery: GetMeQuery) {
    super();
  }

  protected override async handle({
    userId,
  }: Controller.Request<"private">): Promise<
    Controller.Response<GetMeController.Response>
  > {
    const { entities, user } = await this.getMeQuery.execute({ userId });

    return {
      statusCode: 200,
      body: { user: { ...user, entities } },
    };
  }
}

export namespace GetMeController {
  export type Response = {
    user: User & { entities: Entity[] };
  };
}
