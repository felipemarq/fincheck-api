import { Account } from "@application/entities/Account";
import { z } from "zod";

export const createAccountSchema = z.object({
  entityId: z.string().uuid("Id da entidade inválido"),
  initialBalance: z.number(),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.nativeEnum(Account.Type),
  color: z.string().optional(),
});

export type CreateAccountBody = z.infer<typeof createAccountSchema>;
