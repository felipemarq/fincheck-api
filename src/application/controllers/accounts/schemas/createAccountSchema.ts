import { Account } from "@application/entities/Account";
import { z } from "zod";

export const createAccountSchema = z.object({
  entityId: z.string().min(1, "Id da entidade é obrigatório"),
  initialBalance: z.number().min(1, "Saldo inicial é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.nativeEnum(Account.Type),
  color: z.string().optional(),
});

export type CreateAccountBody = z.infer<typeof createAccountSchema>;
