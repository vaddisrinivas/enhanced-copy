import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [join(root, "packages/core/src/cdn.ts")],
  outfile: join(root, "apps/demo/public/cdn/enhanced-copy.cdn.js"),
  bundle: true,
  format: "iife",
  globalName: "EnhancedCopyBundle",
  minify: true,
  platform: "browser",
  sourcemap: false,
  target: "es2022"
});
