import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {neon} from "@neondatabase/serverless";

const aws=(...args)=>JSON.parse(execFileSync("aws",[...args,"--profile","felipe","--region","sa-east-1","--output","json"],{encoding:"utf8"}));
if(aws("sts","get-caller-identity").Account!=="379443323181")throw new Error("Unexpected AWS account.");
const config=aws("lambda","get-function-configuration","--function-name","fincheck-api-dev-financialModule");
const db=neon(config.Environment.Variables.DATABASE_URL);
const tag="0016_invoice-returns";
const source=readFileSync(`drizzle/${tag}.sql`,"utf8").replace(/\r\n/g,"\n");
const hash=createHash("sha256").update(source).digest("hex");
const entry=JSON.parse(readFileSync("drizzle/meta/_journal.json","utf8")).entries.find(x=>x.tag===tag);
const applied=await db`select id from drizzle.__drizzle_migrations where hash=${hash}`;
if(applied.length){console.log("Invoice returns migration already applied.");process.exit(0);}
const columns=await db`select column_name from information_schema.columns where table_schema='public' and table_name='invoices' and column_name='operation_type'`;
if(columns.length)throw new Error("Columns exist without the expected migration; inspect first.");
const snapshot=async()=>({
  invoices:await db`select id,entity_id,customer_id,purchase_order_id,invoice_number,issued_at,due_at,gross_amount,tax_amount,other_deductions,status,notes,created_at,updated_at from invoices order by id`,
  items:await db`select * from invoice_items order by id`,
  payments:await db`select * from receivable_payments order by id`,
});
const before=await snapshot();
mkdirSync("tmp/invoice-returns",{recursive:true});
writeFileSync("tmp/invoice-returns/database-before.json",JSON.stringify(before,null,2));
if(process.argv.includes("--inspect")){console.log(JSON.stringify({invoices:before.invoices.length,items:before.items.length,payments:before.payments.length}));process.exit(0);}
await db.transaction([
  db`select pg_advisory_xact_lock(hashtext('moneystack:invoice-returns'))`,
  ...source.split("--> statement-breakpoint").map(s=>s.trim()).filter(Boolean).map(s=>db.query(s)),
  db`insert into drizzle.__drizzle_migrations(hash,created_at) values (${hash},${entry.when})`,
]);
const after=await snapshot();
if(JSON.stringify(before)!==JSON.stringify(after))throw new Error("Original fiscal records changed during migration; inspect snapshot.");
console.log(JSON.stringify({migration:tag,preservedInvoices:after.invoices.length,preservedItems:after.items.length,preservedPayments:after.payments.length}));
