import { optionalDate, optionalString } from "@application/controllers/v2Schemas";
import {
  receivableFilterStatuses,
  receivableSortOptions,
} from "@application/queries/types/ReceivableView";
import { z } from "zod";

export const listReceivablesQuerySchema = z
  .object({
    search: optionalString(160),
    status: z.enum(receivableFilterStatuses).default("PENDING"),
    dueFrom: optionalDate,
    dueTo: optionalDate,
    sort: z.enum(receivableSortOptions).default("URGENCY"),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(10).max(100).default(20),
  })
  .superRefine((value, context) => {
    if (
      value.dueFrom &&
      value.dueTo &&
      value.dueFrom.getTime() > value.dueTo.getTime()
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueTo"],
        message: "A data final deve ser igual ou posterior a data inicial.",
      });
    }
  });

export type ListReceivablesQuery = z.infer<
  typeof listReceivablesQuerySchema
>;
