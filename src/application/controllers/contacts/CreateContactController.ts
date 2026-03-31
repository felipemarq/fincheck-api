import { Controller } from "@application/contracts/Controller";
import { Contact } from "@application/entities/Contact";
import { Injectable } from "@kernel/decorators/Injectable";
import { Schema } from "@kernel/decorators/Schema";
import { CreateContactUseCase } from "@application/useCases/contacts/CreateContactUseCase";

import {
  ContactEntityParams,
  contactEntityParamsSchema,
} from "./schemas/contactEntityParamsSchema";
import {
  CreateContactBody,
  createContactSchema,
} from "./schemas/createContactSchema";

@Injectable()
@Schema(createContactSchema)
export class CreateContactController extends Controller<
  "private",
  CreateContactController.Response
> {
  constructor(private readonly createContactUseCase: CreateContactUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<"private", CreateContactBody, ContactEntityParams>) {
    const createParams = contactEntityParamsSchema.parse(params);

    const contact = await this.createContactUseCase.execute({
      entityId: createParams.entityId,
      userId,
      ...body,
    });

    return {
      statusCode: 201,
      body: { contact },
    };
  }
}

export namespace CreateContactController {
  export type Response = {
    contact: Contact;
  };
}
