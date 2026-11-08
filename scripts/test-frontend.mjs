import { startVitest } from "vitest/node";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs/promises";
const root = process.cwd();
await fs.mkdir(path.join(root, "var"), { recursive: true });
const ctx = await startVitest(
  "test",
  [],
  {
    config: false,
    run: true,
    fsModuleCache: false,
    root,
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    reporters: ["default", "json"],
    outputFile: { json: "var/frontend-tests.json" },
  },
  { plugins: [react()], resolve: { alias: { "@": path.join(root, "src") } } },
);
if (ctx) await ctx.close();
