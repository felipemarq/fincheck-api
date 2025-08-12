import { ErrorCode } from "../ErrorCode";

export abstract class HttpError extends Error {
  abstract statusCode: number;

  abstract code: ErrorCode;
}
