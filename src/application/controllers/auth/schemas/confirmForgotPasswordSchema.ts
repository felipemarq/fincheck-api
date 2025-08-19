import { z } from "zod";

export const confirmForgotPasswordSchema = z.object({
  email: z.string().min(5, "Email is too short").email("Invalid email"),
  confirmationCode: z.string().min(1, "Confirmation code is too short"),
  password: z.string({ message: "Password should be a string" }).min(8, "Password is too short"),
});

export type ConfirmForgotPasswordBody = z.infer<typeof confirmForgotPasswordSchema>;
