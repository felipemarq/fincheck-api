import esbuildPluginTsc from "esbuild-plugin-tsc";
export default (serverless) => ({
  bundle: true,
  minify: true,
  sourcemap: false,
  exclude: ["@aws-sdk/*"],
  external: ["@aws-sdk/*"],
  plugins: [esbuildPluginTsc()],
});
