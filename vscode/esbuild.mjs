// Bundles the extension (TypeScript) together with the Fable-compiled F# core
// and its runtime into a single CommonJS file that VS Code loads.
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",
  target: "node18",
  // `vscode` is provided by the host at runtime — never bundle it.
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("esbuild: watching…");
} else {
  await esbuild.build(options);
}
