import { defineConfig } from "vitest/config";

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
      "@enhanced-copy/core": "/Users/srinivasvaddi/Projects/enhanced-copy/packages/core/src/index.ts",
      "@enhanced-copy/react": "/Users/srinivasvaddi/Projects/enhanced-copy/packages/react/src/index.tsx"
    }
  }
});
