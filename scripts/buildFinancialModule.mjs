import { mkdir } from "node:fs/promises";
import { build } from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";

await mkdir("tmp/financial-module-package", { recursive: true });
await build({
  entryPoints: ["src/main/functions/invoices/financialModule.ts"],
  outfile: "tmp/financial-module-package/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  minify: true,
  keepNames: true,
  sourcemap: false,
  external: ["@aws-sdk/*"],
  plugins: [esbuildPluginTsc({ force: true })],
});
console.log("Financial module built.");
