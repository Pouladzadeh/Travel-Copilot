import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Eval harness config. Kept apart from the app's tests so `npm test` stays free and fast.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["evals/**/*.test.ts"], testTimeout: 2 * 60 * 60 * 1000 },
});
