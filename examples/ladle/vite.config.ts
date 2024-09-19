import { casablanca } from "@casablanca-css/core/vite";
import { casablancaStyled } from "@casablanca-css/styled/vite";
import react from "@vitejs/plugin-react";
import postcssNested from "postcss-nested";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
    devSourcemap: true,
  },
  plugins: [tsconfigPaths(), react(), casablancaStyled(), casablanca()],
});
