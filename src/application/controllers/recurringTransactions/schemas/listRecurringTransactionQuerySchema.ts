import { RecurringTransaction } from "@application/entities/RecurringTransaction";
import { Transaction } from "@application/entities/Transaction";
import { z } from "zod";

const csvToUuidArray = z.preprocess((val) => {
  if (val == null) return [];
  const arr = Array.isArray(val) ? val : [String(val)];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}, z.array(z.string().uuid()));

const csvToTransactionTypeArray = z.preprocess((val) => {
  if (val == null) return [];
  const arr = Array.isArray(val) ? val : [String(val)];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}, z.array(z.nativeEnum(Transaction.Type)));

const csvToRecurrenceTypeArray = z.preprocess((val) => {
  if (val == null) return [];
  const arr = Array.isArray(val) ? val : [String(val)];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}, z.array(z.nativeEnum(RecurringTransaction.Recurrence)));

const optionalDate = z.preprocess((val) => {
  if (val == null) return undefined; // não veio
  const s = String(val).trim();
  if (!s) return undefined; // veio vazio → ignora
  const d = new Date(s);
  return d; // se for inválido, z.date() acusa
}, z.date().optional());

const optionalBool = z.preprocess((val) => {
  if (val == null) return undefined;
  const s = String(val).trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return val; // deixa o z.boolean() acusar erro se vier lixo
}, z.boolean().optional());

export const listRecurringTransactionQuerySchema = z.object({
  entityId: z.string().uuid(),
  accountId: csvToUuidArray.optional(),
  categoryId: csvToUuidArray.optional(),
  name: z.string().optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  type: csvToTransactionTypeArray.optional(),
  value: z.string().optional(),
  recurrence: csvToRecurrenceTypeArray.optional(),
  sortBy: z
    .enum(["startDate", "endDate", "createdAt", "value", "name"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
});

export type ListRecurringTransactionQuery = z.infer<
  typeof listRecurringTransactionQuerySchema
>;
