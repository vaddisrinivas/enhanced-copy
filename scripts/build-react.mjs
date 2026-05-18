import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const shared = {
  entryPoints: [join(root, "packages/react/src/index.tsx")],
  bundle: true,
  sourcemap: true,
  platform: "browser",
  target: "es2022",
  external: ["react", "react/jsx-runtime", "@enhanced-copy/core"]
};

await Promise.all([
  build({
    ...shared,
    outfile: join(root, "packages/react/dist/index.js"),
    format: "esm"
  }),
  build({
    ...shared,
    outfile: join(root, "packages/react/dist/index.cjs"),
    format: "cjs"
  })
]);
