import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL before migrating.");
const db = neon(process.env.DATABASE_URL);
const tag = "0014_shopping-lists";
const source = readFileSync(`drizzle/${tag}.sql`, "utf8");
const hash = createHash("sha256").update(source).digest("hex");
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const entry = journal.entries.find(entry => entry.tag === tag);
const existing = await db`select to_regclass('public.shopping_lists') as lists, to_regclass('public.shopping_list_items') as items`;
if (existing[0].lists || existing[0].items) {
  const applied = await db`select id from drizzle.__drizzle_migrations where hash = ${hash}`;
  if (existing[0].lists && existing[0].items && applied.length) { console.log("Shopping lists migration already applied."); process.exit(0); }
  throw new Error("Shopping list tables already exist without the expected migration. Inspect before proceeding.");
}
// Preserve the current schema and migration history before the additive change.
mkdirSync("tmp", { recursive: true });
const schema = await db`select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position`;
const migrations = await db`select * from drizzle.__drizzle_migrations order by created_at`;
writeFileSync("tmp/schema-before-shopping-lists.json", JSON.stringify({ schema, migrations }, null, 2));
const statements = source.split("--> statement-breakpoint").map(statement => statement.trim()).filter(Boolean);
await db.transaction([
  ...statements.map(statement => db.query(statement)),
  db`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`,
]);
console.log("Applied only the additive shopping lists migration. Existing production tables were preserved.");
