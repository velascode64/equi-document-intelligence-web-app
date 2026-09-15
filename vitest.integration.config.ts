import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(projectRoot),
    },
  },
  test: {
    environment: "node",
    include: ["src/features/**/__tests__/**/*.integration.test.ts"],
    setupFiles: ["src/features/smart-findoc-analyzer/__tests__/setup-integration-env.ts"],
    testTimeout: 120_000,
  },
})
