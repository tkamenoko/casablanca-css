import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { macrostyles } from '@macrostyles/core/vite';
import postcssNested from 'postcss-nested';

export default defineConfig({
  css: {
    postcss: { plugins: [postcssNested()] },
  },
  plugins: [react(), macrostyles()],
});
