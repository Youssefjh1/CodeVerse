import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import os from "node:os";
import path from "node:path";

export default defineConfig({
  cacheDir: path.join(os.tmpdir(), "codeverse-vitest-cache"),
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
