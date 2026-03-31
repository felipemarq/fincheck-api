import { Controller } from "@application/contracts/Controller";
import { Injectable } from "@kernel/decorators/Injectable";
import { DeleteContactUseCase } from "@application/useCases/contacts/DeleteContactUseCase";

import { ContactParams, contactParamsSchema } from "./schemas/contactParamsSchema";

@Injectable()
export class DeleteContactController extends Controller<
  "private",
  DeleteContactController.Response
> {
  constructor(private readonly deleteContactUseCase: DeleteContactUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<"private", Record<string, never>, ContactParams>) {
    const deleteParams = contactParamsSchema.parse(params);

    const { statusCode } = await this.deleteContactUseCase.execute({
      contactId: deleteParams.contactId,
      entityId: deleteParams.entityId,
      userId,
    });

    return {
      statusCode,
    };
  }
}

export namespace DeleteContactController {
  export type Response = Record<string, never>;
}
