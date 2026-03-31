import { Entity } from "@application/entities/Entity";
import { z } from "zod";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createEntitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome da entidade é obrigatório.")
    .max(120, "Nome da entidade deve ter no máximo 120 caracteres."),
  type: z.nativeEnum(Entity.Type),
  color: z
    .string()
    .regex(colorRegex, "Cor deve estar no formato hexadecimal.")
    .optional(),
});

export type CreateEntityBody = z.infer<typeof createEntitySchema>;
