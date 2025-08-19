import { ErrorCode } from "../ErrorCode";
import { HttpStatusCode } from "../HttpStatusCode";
import { HttpError } from "./HttpError";

export class BadRequestException extends HttpError {
  public override statusCode = HttpStatusCode.BAD_REQUEST;
  public override code: ErrorCode;

  constructor(message?: any, code?: ErrorCode) {
    super();
    this.name = "BadRequestException";
    this.message = message ?? "Bad request";
    this.code = code ?? ErrorCode.BAD_REQUEST;
  }
}
