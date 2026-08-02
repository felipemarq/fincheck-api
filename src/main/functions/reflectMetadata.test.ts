import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const functionsDirectory = join(process.cwd(), "src", "main", "functions");

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);

      return entry.isDirectory() ? listTypeScriptFiles(path) : [path];
    })
  );

  return files
    .flat()
    .filter((path) => path.endsWith(".ts") && !path.endsWith(".test.ts"));
}

test("HTTP Lambda entrypoints load reflect-metadata before decorated controllers", async () => {
  const files = await listTypeScriptFiles(functionsDirectory);
  const missingImport: string[] = [];

  await Promise.all(
    files.map(async (path) => {
      const source = await readFile(path, "utf8");

      if (
        source.includes("lambdaHttpAdapter(") &&
        !source.startsWith('import "reflect-metadata";')
      ) {
        missingImport.push(path.replace(`${process.cwd()}\\`, ""));
      }
    })
  );

  assert.deepEqual(missingImport.sort(), []);
});
