import { z } from "zod";

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ message: "Refresh token should be a string" })
    .min(1, "Refresh token is too short"),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
