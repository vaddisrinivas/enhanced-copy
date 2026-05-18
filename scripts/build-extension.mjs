import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const app = join(root, "apps/extension");
const dist = join(app, "dist");

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  build({
    entryPoints: [join(app, "src/background.ts")],
    outfile: join(dist, "background.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "chrome120",
    sourcemap: true
  }),
  build({
    entryPoints: [join(app, "src/content.ts")],
    outfile: join(dist, "content.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome120",
    sourcemap: true
  }),
  build({
    entryPoints: [join(app, "src/popup.tsx")],
    outfile: join(dist, "popup.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome120",
    sourcemap: true,
    loader: { ".css": "css" }
  })
]);

await cp(join(app, "manifest.json"), join(dist, "manifest.json"));
await cp(join(app, "src/popup.html"), join(dist, "popup.html"));

const popupHtml = await readFile(join(dist, "popup.html"), "utf8");
await writeFile(
  join(dist, "popup.html"),
  popupHtml.replace("</head>", '<link rel="stylesheet" href="./popup.css" /></head>')
);
