import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodeExternals from 'rollup-plugin-node-externals';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        vite: './src/vite/index.ts',
      },
      formats: ['es'],
    },
    minify: true,
  },
  plugins: [
    { ...nodeExternals(), enforce: 'pre' },
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
    tsconfigPaths(),
  ],
  test: { testTimeout: 10000 },
});
