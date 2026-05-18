import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifactsDir = join(root, "artifacts");
const output = join(artifactsDir, "enhanced-copy-extension-v0.1.0.zip");

mkdirSync(artifactsDir, { recursive: true });
rmSync(output, { force: true });
execFileSync("zip", ["-r", output, "."], {
  cwd: join(root, "apps/extension/dist"),
  stdio: "inherit"
});

console.log(output);
