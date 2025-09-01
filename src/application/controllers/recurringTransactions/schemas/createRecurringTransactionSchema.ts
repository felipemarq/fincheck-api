// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { Transaction } from "@application/entities/Transaction";
import { RecurringTransaction } from "@application/entities/RecurringTransaction";

export const createRecurringTransactionSchema = z
  .object({
    // contexto
    entityId: z
      .string({ required_error: "Id da entidade é obrigatório" })
      .uuid("entityId inválido"),
    // vínculos
    accountId: z
      .string({ required_error: "Conta é obrigatória" })
      .uuid("accountId inválido"),
    categoryId: z
      .string({ required_error: "Categoria é obrigatória" })
      .uuid("categoryId inválido"),
    creditCardId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),

    // dados principais
    name: z
      .string({ required_error: "Nome é obrigatório" })
      .min(1, "Nome é obrigatório")
      .max(120, "Nome deve ter no máximo 120 caracteres"),

    value: z.coerce
      .number({ required_error: "Valor é obrigatório" })
      .positive("Valor deve ser maior que zero"),

    type: z.nativeEnum(Transaction.Type, {
      required_error: "Tipo é obrigatório",
    }), // "INCOME" | "EXPENSE"

    startDate: z.coerce.date({ required_error: "Data é obrigatória" }),
    endDate: z.coerce.date({ required_error: "Data é obrigatória" }),
    recurrence: z.nativeEnum(RecurringTransaction.Recurrence, {
      required_error: "Tipo é obrigatório",
    }),

    notes: z.string().max(500, "Observações até 500 caracteres").optional(),
  })
  .refine((data) => !data.startDate || data.endDate >= data.startDate, {
    message: "Data de término não pode ser anterior à data de início",
    path: ["startDate"],
  });

export type CreateRecurringTransactionBody = z.infer<
  typeof createRecurringTransactionSchema
>;

/* export const recurringTransactionsTable = pgTable(
  {
    entityId,
    userId,
    accountId,
    categoryId,
    creditCardId,
    name,
    value,
    type,
    startDate,
    endDate:,
    recurrence,
    // Opcional: série para idempotência (ex.: UUID fixo para a recorrência)
    seriesKey: varchar("series_key", { length: 64 }),
  },
  
); */
