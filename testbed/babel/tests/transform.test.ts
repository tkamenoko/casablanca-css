import { test } from 'vitest';
import { transform } from '@babel/core';
import { babelMacrostylesPlugin } from '@macrostyles/core/babel';

import objectPropertiesCss from './fixtures/objectProperties?raw';
import staticCss from './fixtures/static?raw';

test('should transform code with static css', async ({ expect }) => {
  const transformed = transform(staticCss, {
    plugins: [[babelMacrostylesPlugin, {}]],
    filename: 'fixtures/static.ts', // TODO: set full path?
    parserOpts: {
      plugins: ['typescript'],
    },
  });
  console.log(transformed?.code);
  expect(transformed?.code).not.toMatch(/css`/);
});

test.todo('should transform code with object access', async ({ expect }) => {
  const transformed = transform(objectPropertiesCss, {
    plugins: [[babelMacrostylesPlugin, {}]],
    parserOpts: {
      plugins: ['typescript'],
    },
  });
  console.log(transformed?.code);
  expect(transformed?.code).not.toMatch(/css`/);
});
