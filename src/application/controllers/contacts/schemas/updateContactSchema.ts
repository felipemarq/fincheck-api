import { z } from "zod";
import { createContactSchema } from "./createContactSchema";

export const updateContactSchema = createContactSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para atualizar.",
  });

export type UpdateContactBody = z.infer<typeof updateContactSchema>;
