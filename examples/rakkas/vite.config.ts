import { casablanca } from "@casablanca/core/vite";
import { casablancaReact } from "@casablanca/react/vite";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), casablancaReact(), casablanca(), rakkas()],
});
