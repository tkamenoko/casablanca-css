import { defineConfig } from 'vite';
import rakkas from 'rakkasjs/vite-plugin';
import { macrostyles } from '@macrostyles/core/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { macrostylesReact } from '@macrostyles/react/vite';

export default defineConfig({
  plugins: [tsconfigPaths(), macrostylesReact(), macrostyles(), rakkas()],
});
