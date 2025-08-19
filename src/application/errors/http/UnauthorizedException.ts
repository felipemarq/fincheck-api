import { ErrorCode } from "../ErrorCode";
import { HttpStatusCode } from "../HttpStatusCode";
import { HttpError } from "./HttpError";

export class UnauthorizedException extends HttpError {
  public override statusCode = HttpStatusCode.UNAUTHORIZED;
  public override code: ErrorCode;

  constructor(message?: any, code?: ErrorCode) {
    super();
    this.name = "UnauthorizedException";
    this.message = message ?? "Unauthorized";
    this.code = code ?? ErrorCode.UNAUTHORIZED;
  }
}
