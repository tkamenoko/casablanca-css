import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    vite: "./src/vite/index.ts",
  },
  outDir: "./dist/lib",
});
