import { macrostyles } from "@macrostyles/core/vite";
import { macrostylesReact } from "@macrostyles/react/vite";
import react from "@vitejs/plugin-react";
import postcssNested from "postcss-nested";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
  },
  plugins: [react(), macrostylesReact(), macrostyles()],
});
