import { casablanca } from "@casablanca/core/vite";
import { casablancaStyled } from "@casablanca/styled/vite";
import react from "@vitejs/plugin-react";
import postcssNested from "postcss-nested";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    casablancaStyled(),
    casablanca({ evaluateOptions: { globals: { rakkas: {} } } }),
    rakkas(),
  ],
});
