import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().min(5, "Email is too short").email("Invalid email"),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
