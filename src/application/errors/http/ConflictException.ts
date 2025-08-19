import { ErrorCode } from "../ErrorCode";
import { HttpStatusCode } from "../HttpStatusCode";
import { HttpError } from "./HttpError";

export class ConflictException extends HttpError {
  public override statusCode = HttpStatusCode.CONFLICT;
  public override code: ErrorCode;

  constructor(message?: any, code?: ErrorCode) {
    super();
    this.name = "ConflictException";
    this.message = message ?? "Conflict";
    this.code = code ?? ErrorCode.CONFLICT;
  }
}
