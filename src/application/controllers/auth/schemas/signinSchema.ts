import { z } from "zod";

export const signInSchema = z.object({
  password: z
    .string({ message: "Password should be a string" })
    .min(2, "Password is too short"),
  email: z.string().min(5, "Email is too short").email("Invalid email"),
});

export type SignInBody = z.infer<typeof signInSchema>;
