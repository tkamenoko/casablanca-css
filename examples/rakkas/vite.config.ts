import { casablanca } from "@casablanca/core/vite";
import { casablancaStyled } from "@casablanca/styled/vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    casablancaStyled(),
    casablanca({ evaluateOptions: { globals: { rakkas: {} } } }),
    rakkas(),
  ],
});
