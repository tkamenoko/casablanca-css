import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';

import packageJson from './package.json';
const dependencies = Object.keys(packageJson.dependencies);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        vite: './src/vite/index.ts',
      },
      formats: ['es'],
    },
  },
  plugins: [
    { ...nodeExternals(), enforce: 'pre' },
    dts({
      insertTypesEntry: true,
    }),
    tsconfigPaths(),
  ],
  test: {},
});
