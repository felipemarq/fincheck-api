import { ErrorCode } from "@application/errors/ErrorCode";

interface ILambdaErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: any;
}
export function lambdaErrorResponse({
  code,
  message,
  statusCode,
}: ILambdaErrorResponse) {
  return {
    statusCode,
    body: JSON.stringify({
      error: {
        code,
        message,
      },
    }),
  };
}
