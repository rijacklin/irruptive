import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    // Integration suites share TEST_DATABASE_URL, and UI suites use global DOM state.
    fileParallelism: false,
    maxWorkers: 1,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["apps/api/**/*.test.ts", "packages/**/*.test.ts"],
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
