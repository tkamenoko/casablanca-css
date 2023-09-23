import { defineConfig } from 'vite';
import rakkas from 'rakkasjs/vite-plugin';
import { macrostyles } from '@macrostyles/core/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), rakkas(), macrostyles()],
});
