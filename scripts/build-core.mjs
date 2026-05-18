import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const shared = {
  entryPoints: [join(root, "packages/core/src/index.ts")],
  bundle: true,
  sourcemap: true,
  platform: "browser",
  target: "es2022"
};

await Promise.all([
  build({
    ...shared,
    outfile: join(root, "packages/core/dist/index.js"),
    format: "esm"
  }),
  build({
    ...shared,
    outfile: join(root, "packages/core/dist/index.cjs"),
    format: "cjs"
  })
]);
