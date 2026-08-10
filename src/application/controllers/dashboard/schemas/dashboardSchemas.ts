import { optionalDate } from "@application/controllers/v2Schemas";
import { z } from "zod";

export const operationsDashboardQuerySchema = z
  .object({
    issuedFrom: optionalDate,
    issuedTo: optionalDate,
  })
  .superRefine((value, context) => {
    if (Boolean(value.issuedFrom) !== Boolean(value.issuedTo)) {
      context.addIssue({
        code: "custom",
        path: [value.issuedFrom ? "issuedTo" : "issuedFrom"],
        message: "Informe o inicio e o fim do periodo.",
      });
    }

    if (
      value.issuedFrom &&
      value.issuedTo &&
      value.issuedFrom.getTime() > value.issuedTo.getTime()
    ) {
      context.addIssue({
        code: "custom",
        path: ["issuedTo"],
        message: "A data final deve ser igual ou posterior a data inicial.",
      });
    }
  });

export type OperationsDashboardQuery = z.infer<
  typeof operationsDashboardQuerySchema
>;
