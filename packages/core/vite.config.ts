import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

import packageJson from './package.json';

const dependencies = Object.keys(packageJson.dependencies);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        vite: './src/vite/index.ts',
        babel: './src/babel/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: { external: dependencies },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  test: {},
});
