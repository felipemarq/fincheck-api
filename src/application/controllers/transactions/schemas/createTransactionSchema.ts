// src/application/controllers/transactions/schemas/createTransactionSchema.ts
import { z } from "zod";
import { Transaction } from "@application/entities/Transaction";

export const createTransactionSchema = z
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
    installmentPurchaseId: z.string().uuid().optional(),
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

    isPaid: z.boolean().default(false),

    date: z.coerce.date({ required_error: "Data é obrigatória" }),
    dueDate: z.coerce.date().optional(),

    notes: z.string().max(500, "Observações até 500 caracteres").optional(),
  })
  .refine((data) => !data.dueDate || data.dueDate >= data.date, {
    message: "dueDate não pode ser anterior à data",
    path: ["dueDate"],
  });

export type CreateTransactionBody = z.infer<typeof createTransactionSchema>;
