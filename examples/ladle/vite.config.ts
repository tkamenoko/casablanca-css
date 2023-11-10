import { defineConfig } from 'vite';
import { macrostyles } from '@macrostyles/core/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { macrostylesReact } from '@macrostyles/react/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [tsconfigPaths(), react(), macrostylesReact(), macrostyles()],
});
