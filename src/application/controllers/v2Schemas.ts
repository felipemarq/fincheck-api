import { z } from "zod";

export const optionalString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === null) {
        return undefined;
      }

      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z.string().max(max).optional()
  );

export const nullableOptionalString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === null) {
        return null;
      }

      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    },
    z.string().max(max).nullable().optional()
  );

export const optionalDate = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return value;
}, z.coerce.date().optional());

export const nullableOptionalDate = z.preprocess((value) => {
  if (value === null || value === "") {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.date().nullable().optional());

export const optionalBoolean = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return value;
}, z.boolean().optional());

export const organizationParamsSchema = z.object({
  entityId: z.string().uuid(),
});

export type OrganizationParams = z.infer<typeof organizationParamsSchema>;
