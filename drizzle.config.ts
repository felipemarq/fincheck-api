import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infra/database/neon/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
