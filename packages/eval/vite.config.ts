import nodeExternals from "rollup-plugin-node-externals";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        loaders: "./src/loaders/index.ts",
      },
      formats: ["es"],
    },
    target: ["node20"],
    minify: false,
    outDir: "./dist/lib",
  },
  plugins: [
    { ...nodeExternals(), enforce: "pre", apply: "build" },
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
    tsconfigPaths(),
  ],
});
