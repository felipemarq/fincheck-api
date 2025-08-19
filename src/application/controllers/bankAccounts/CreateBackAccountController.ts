import { Schema } from "@kernel/decorators/Schema";

import { Controller } from "@application/contracts/Controller";

import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class CreateBackAccountController extends Controller<
  "private",
  CreateBackAccountController.Response
> {
  constructor() {
    super();
  }

  protected override async handle({
    userId,
  }: Controller.Request<"private">): Promise<
    Controller.Response<CreateBackAccountController.Response>
  > {
    return {
      statusCode: 200,
      body: {
        userId,
      },
    };
  }
}

export namespace CreateBackAccountController {
  export type Response = {
    userId: string;
  };
}
