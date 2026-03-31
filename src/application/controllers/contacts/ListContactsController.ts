import { Controller } from "@application/contracts/Controller";
import { Contact } from "@application/entities/Contact";
import { Injectable } from "@kernel/decorators/Injectable";
import { ListContactsUseCase } from "@application/useCases/contacts/ListContactsUseCase";

import {
  ContactEntityParams,
  contactEntityParamsSchema,
} from "./schemas/contactEntityParamsSchema";

@Injectable()
export class ListContactsController extends Controller<
  "private",
  ListContactsController.Response
> {
  constructor(private readonly listContactsUseCase: ListContactsUseCase) {
    super();
  }

  protected override async handle({
    userId,
    params,
  }: Controller.Request<"private", Record<string, never>, ContactEntityParams>) {
    const listParams = contactEntityParamsSchema.parse(params);

    const { contacts } = await this.listContactsUseCase.execute({
      entityId: listParams.entityId,
      userId,
    });

    return {
      statusCode: 200,
      body: { contacts },
    };
  }
}

export namespace ListContactsController {
  export type Response = {
    contacts: Contact[];
  };
}
