import { Account } from "@application/entities/Account";
import { z } from "zod";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createAccountSchema = z.object({
  entityId: z.string().uuid("Id da entidade invalido."),
  initialBalance: z.number(),
  name: z
    .string()
    .trim()
    .min(1, "Nome e obrigatorio.")
    .max(120, "Nome deve ter no maximo 120 caracteres."),
  type: z.nativeEnum(Account.Type),
  color: z
    .string()
    .regex(colorRegex, "Cor deve estar no formato hexadecimal.")
    .optional(),
});

export type CreateAccountBody = z.infer<typeof createAccountSchema>;
