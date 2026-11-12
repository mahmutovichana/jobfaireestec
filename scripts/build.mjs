import { build } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
const root = process.cwd();
await build({
  configFile: false,
  root,
  plugins: [react()],
  resolve: {
    alias: { "@": path.join(root, "src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
    ],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
