import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    loaders: "./src/loaders/index.ts",
  },
  outDir: "./dist/lib",
});
