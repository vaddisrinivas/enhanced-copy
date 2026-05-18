import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@enhanced-copy/core": "/Users/srinivasvaddi/Projects/enhanced-copy/packages/core/src/index.ts",
      "@enhanced-copy/react": "/Users/srinivasvaddi/Projects/enhanced-copy/packages/react/src/index.tsx"
    }
  }
});
