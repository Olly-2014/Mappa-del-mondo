import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  base: "./",
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
