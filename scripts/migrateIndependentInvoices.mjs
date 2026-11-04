import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const aws = (...args) =>
  JSON.parse(
    execFileSync(
      "aws",
      [
        ...args,
        "--profile",
        "felipe",
        "--region",
        "sa-east-1",
        "--output",
        "json",
      ],
      { encoding: "utf8" },
    ),
  );
if (aws("sts", "get-caller-identity").Account !== "379443323181")
  throw new Error("Unexpected AWS account.");
const config = aws(
  "lambda",
  "get-function-configuration",
  "--function-name",
  "fincheck-api-dev-listReceivables",
);
const db = neon(config.Environment.Variables.DATABASE_URL);
const tag = "0015_independent-invoices";
const source = readFileSync(`drizzle/${tag}.sql`, "utf8").replace(/\r\n/g, "\n");
const hash = createHash("sha256").update(source).digest("hex");
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const entry = journal.entries.find((item) => item.tag === tag);
const snapshot = async () => ({
  invoices:
    await db`select id,entity_id,purchase_order_id,invoice_number,issued_at,due_at,gross_amount,tax_amount,other_deductions,status,notes,created_at,updated_at from invoices order by id`,
  items:
    await db`select id,entity_id,invoice_id,purchase_order_item_id,invoiced_quantity,unit_price,total_amount,notes,created_at,updated_at from invoice_items order by id`,
  payments: await db`select * from receivable_payments order by id`,
});
const applied =
  await db`select id from drizzle.__drizzle_migrations where hash = ${hash}`;
if (applied.length) {
  console.log("Independent invoices migration already applied.");
  process.exit(0);
}
const columns =
  await db`select column_name from information_schema.columns where table_schema='public' and table_name='invoices' and column_name='customer_id'`;
if (columns.length)
  throw new Error(
    "Invoice columns already exist without the expected migration. Inspect before proceeding.",
  );
const before = await snapshot();
const schema =
  await db`select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position`;
const migrations =
  await db`select * from drizzle.__drizzle_migrations order by created_at`;
mkdirSync("tmp/independent-invoices", { recursive: true });
writeFileSync(
  "tmp/independent-invoices/database-before.json",
  JSON.stringify({ before, schema, migrations }, null, 2),
);
if (process.argv.includes("--inspect")) {
  console.log(
    JSON.stringify({
      invoices: before.invoices.length,
      items: before.items.length,
      payments: before.payments.length,
      schemaSaved: true,
    }),
  );
  process.exit(0);
}
const statements = source
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);
await db.transaction([
  db`select pg_advisory_xact_lock(hashtext('moneystack:independent-invoices'))`,
  ...statements.map((statement) => db.query(statement)),
  db`insert into drizzle.__drizzle_migrations(hash,created_at) values (${hash},${entry.when})`,
]);
const after = await snapshot();
if (JSON.stringify(before) !== JSON.stringify(after))
  throw new Error(
    "Financial records changed during migration; compare the saved snapshot before publishing.",
  );
console.log(
  JSON.stringify({
    migration: tag,
    invoicesPreserved: after.invoices.length,
    itemsPreserved: after.items.length,
    paymentsPreserved: after.payments.length,
  }),
);
