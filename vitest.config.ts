import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          // Database-backed suites share TEST_DATABASE_URL and clean shared tables.
          fileParallelism: false,
          include: [
            "apps/api/**/*.test.ts",
            "apps/worker/**/*.test.ts",
            "packages/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "web",
          environment: "jsdom",
          include: ["apps/web/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
