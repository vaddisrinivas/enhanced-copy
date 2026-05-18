import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/enhanced-copy/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@enhanced-copy/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@enhanced-copy/react": fileURLToPath(new URL("../../packages/react/src/index.tsx", import.meta.url))
    }
  }
});
