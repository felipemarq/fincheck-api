import { Account } from "@application/entities/Account";
import { z } from "zod";

export const createCreditCardSchema = z.object({
  entityId: z.string().uuid("Id da entidade inválido"),
  accountId: z.string().uuid("Id da conta inválido"),
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().optional(),
  closingDay: z.number().min(1, "Dia de fechamento é obrigatório"),
  dueDay: z.number().min(1, "Dia de vencimento é obrigatório"),
  creditLimit: z.number().min(1, "Limite de crédito é obrigatório"),
});

export type CreateCreditCardBody = z.infer<typeof createCreditCardSchema>;
