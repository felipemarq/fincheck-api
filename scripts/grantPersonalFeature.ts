import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { PersonalFeature } from "@application/entities/PersonalFeature";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const [email, requestedFeature = PersonalFeature.BODY_WEIGHT] = args;
  const databaseUrl = process.env.DATABASE_URL;

  if (!email) {
    throw new Error("Informe o e-mail do usuario.");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  if (!Object.values(PersonalFeature).includes(requestedFeature as PersonalFeature)) {
    throw new Error("Feature desconhecida.");
  }

  const sql = neon(databaseUrl);
  await sql`
    INSERT INTO user_features (user_id, feature)
    SELECT id, ${requestedFeature}
    FROM users
    WHERE lower(email) = lower(${email})
    ON CONFLICT (user_id, feature) DO NOTHING
  `;

  const [access] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM user_features uf
      INNER JOIN users u ON u.id = uf.user_id
      WHERE lower(u.email) = lower(${email})
        AND uf.feature = ${requestedFeature}
    ) AS enabled
  `;

  if (!access?.enabled) {
    throw new Error("Usuario nao encontrado ou feature nao habilitada.");
  }

  const [summary] = await sql`
    SELECT count(*)::integer AS "enabledCount"
    FROM user_features
    WHERE feature = ${requestedFeature}
  `;

  console.log(`Feature ${requestedFeature} habilitada para ${email}.`);
  console.log(`Total de usuarios com a feature: ${summary.enabledCount}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
