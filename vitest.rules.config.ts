import { defineConfig } from "vitest/config";

// Security-rules tests need the Firestore emulator, so they run apart from `pnpm test`.
export default defineConfig({
  test: { include: ["rules-tests/**/*.test.ts"], environment: "node", testTimeout: 20_000 },
});
