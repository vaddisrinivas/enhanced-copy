import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.ts"],
    globals: true,
    environmentOptions: {
      jsdom: {
        url: "https://example.test/docs"
      }
    }
  },
  resolve: {
    alias: {
      "@enhanced-copy/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      "@enhanced-copy/react": fileURLToPath(new URL("./packages/react/src/index.tsx", import.meta.url))
    }
  }
});
