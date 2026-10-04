import { mkdir } from "node:fs/promises";
import { build } from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";

await mkdir("tmp/shopping-lists-package", { recursive: true });
await build({
  entryPoints: ["src/main/functions/shoppingLists/shoppingLists.ts"],
  outfile: "tmp/shopping-lists-package/index.js", bundle: true, platform: "node", target: "node22", format: "cjs",
  minify: true, keepNames: true, sourcemap: false, external: ["@aws-sdk/*"],
  plugins: [esbuildPluginTsc({ force: true })],
});
console.log("Shopping lists Lambda built: tmp/shopping-lists-package/index.js");
