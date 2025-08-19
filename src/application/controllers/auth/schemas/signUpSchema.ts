import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  password: z
    .string({ message: "Password should be a string" })
    .min(8, "Password is too short"),
  email: z.string().min(5, "Email is too short").email("Invalid email"),
});

export type SignUpBody = z.infer<typeof signUpSchema>;
