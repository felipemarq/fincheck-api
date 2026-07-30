import { ErrorCode } from "../ErrorCode";
import { HttpStatusCode } from "../HttpStatusCode";
import { HttpError } from "./HttpError";

export class NotFoundException extends HttpError {
  public override statusCode = HttpStatusCode.NOT_FOUND;
  public override code: ErrorCode;

  constructor(message?: string, code?: ErrorCode) {
    super();
    this.name = "NotFoundException";
    this.message = message ?? "Resource not found";
    this.code = code ?? ErrorCode.RESOURCE_NOT_FOUND;
  }
}
