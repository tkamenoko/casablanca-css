import { casablanca } from "@casablanca/core/vite";
import postcssNested from "postcss-nested";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [casablanca()],
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
});
