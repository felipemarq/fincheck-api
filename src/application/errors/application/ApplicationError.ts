import { ErrorCode } from "../ErrorCode";

export abstract class ApplicationError extends Error {
  public statusCode?: number;

  abstract code: ErrorCode;
}
