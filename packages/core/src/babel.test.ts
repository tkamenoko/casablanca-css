/// <reference types="vite/client" />

import { test } from 'vitest';
import { transformAsync } from '@babel/core';

import cssInput from './fixtures/css.fixture?raw';
import { babelMacrostylesPlugin } from './babel';

test('css tag', async ({ expect }) => {
  const transformed = await transformAsync(cssInput, {
    filename: 'input.tsx',
    plugins: [babelMacrostylesPlugin({})],
    parserOpts: {
      plugins: ['typescript'],
    },
  });
  expect(transformed).not.toBeNull();
});
