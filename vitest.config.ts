import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["backend/**", "node_modules/**", ".pnpm-store/**", "dist/**"],
  },
});
