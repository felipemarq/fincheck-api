import { Entity } from "@application/entities/Entity";
import { z } from "zod";

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const updateEntitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome da entidade é obrigatório.")
      .max(120, "Nome da entidade deve ter no máximo 120 caracteres.")
      .optional(),
    type: z.nativeEnum(Entity.Type).optional(),
    color: z
      .string()
      .regex(colorRegex, "Cor deve estar no formato hexadecimal.")
      .optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.type !== undefined ||
      value.color !== undefined,
    {
      message: "Informe ao menos um campo para atualizar a entidade.",
    }
  );

export type UpdateEntityBody = z.infer<typeof updateEntitySchema>;
