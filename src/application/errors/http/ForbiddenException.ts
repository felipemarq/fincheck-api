import { ErrorCode } from "../ErrorCode";
import { HttpStatusCode } from "../HttpStatusCode";
import { HttpError } from "./HttpError";

export class ForbiddenException extends HttpError {
  public override statusCode = HttpStatusCode.FORBIDDEN;
  public override code: ErrorCode;

  constructor(message?: any, code?: ErrorCode) {
    super();
    this.name = "ForbiddenException";
    this.message = message ?? "Forbidden";
    this.code = code ?? ErrorCode.FORBIDDEN;
  }
}
