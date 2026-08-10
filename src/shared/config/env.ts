import { z } from "zod";

const schema = z.object({
  // Cognito
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_CLIENT_SECRET: z.string().min(1),
  COGNITO_POOL_ID: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // Files
  QUOTATION_IMAGES_BUCKET: z.string().min(1).optional(),

});

export const env = schema.parse(process.env);
