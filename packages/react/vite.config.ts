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
    target: ['node18'],
    minify: false,
  },
  plugins: [
    // @ts-expect-error plugin type mismatch
    { ...nodeExternals(), enforce: 'pre', apply: 'build' },
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
    tsconfigPaths(),
  ],
  test: {},
});
