import { Account } from "@application/entities/Account";
import { z } from "zod";

export const createCreditCardSchema = z.object({
  entityId: z.string().min(1, "Id da entidade é obrigatório"),
  accountId: z.string().min(1, "Id da conta é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().optional(),
  closingDay: z.number().min(1, "Dia de fechamento é obrigatório"),
  dueDay: z.number().min(1, "Dia de vencimento é obrigatório"),
  creditLimit: z.number().min(1, "Limite de crédito é obrigatório"),
});

export type CreateCreditCardBody = z.infer<typeof createCreditCardSchema>;
