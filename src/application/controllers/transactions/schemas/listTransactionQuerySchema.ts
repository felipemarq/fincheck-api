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

export const listTransactionQuerySchema = z.object({
  entityId: z.string().uuid(),
  accountId: csvToUuidArray.optional(),
  categoryId: csvToUuidArray.optional(),
  type: csvToTransactionTypeArray.optional(),
  isPaid: optionalBool,
  startDate: optionalDate,
  endDate: optionalDate,
  dueDateStart: optionalDate,
  dueDateEnd: optionalDate,
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  sortBy: z.enum(["date", "dueDate", "createdAt", "value", "name"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
});

export type ListTransactionQuery = z.infer<typeof listTransactionQuerySchema>;
