import { z } from "zod";

import { createAccountSchema } from "./createAccountSchema";

export const updateAccountSchema = createAccountSchema
  .omit({ entityId: true })
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para atualizar.",
  });

export type UpdateAccountBody = z.infer<typeof updateAccountSchema>;
