import { Controller } from "@application/contracts/Controller";
import { Contact } from "@application/entities/Contact";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { UpdateContactUseCase } from "@application/useCases/contacts/UpdateContactUseCase";

import { ContactParams, contactParamsSchema } from "./schemas/contactParamsSchema";
import {
  UpdateContactBody,
  updateContactSchema,
} from "./schemas/updateContactSchema";

@Injectable()
@Schema(updateContactSchema)
export class UpdateContactController extends Controller<
  "private",
  UpdateContactController.Response
> {
  constructor(private readonly updateContactUseCase: UpdateContactUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", UpdateContactBody, ContactParams>) {
    const updateParams = contactParamsSchema.parse(params);

    const contact = await this.updateContactUseCase.execute({
      id: updateParams.contactId,
      entityId: updateParams.entityId,
      userId,
      ...body,
    });

    return {
      statusCode: 200,
      body: { contact },
    };
  }
}

export namespace UpdateContactController {
  export type Response = {
    contact: Contact;
  };
}
