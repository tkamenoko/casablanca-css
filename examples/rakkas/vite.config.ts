import { macrostyles } from "@macrostyles/core/vite";
import { macrostylesReact } from "@macrostyles/react/vite";
import rakkas from "rakkasjs/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), macrostylesReact(), macrostyles(), rakkas()],
});
