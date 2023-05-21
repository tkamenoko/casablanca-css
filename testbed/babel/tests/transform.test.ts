import { test } from 'vitest';
import { transform } from '@macrostyles/core/babel';

import objectPropertiesCss from './fixtures/objectProperties?raw';
import staticCss from './fixtures/static?raw';

test('should transform code with static css', async ({ expect }) => {
  const cssLookup = new Map<string, string>();
  const { transformed, css } = await transform(staticCss, {
    fileName: 'fixtures/static.ts',
    cssLookup,
    babelOptions: {
      filename: 'fixtures/static.ts', // TODO: set full path?
      parserOpts: {
        plugins: ['typescript'],
      },
    },
  });

  console.log(transformed);
  expect(transformed).not.toMatch(/css`/);
  console.log(css);
  expect(css).not.toBeUndefined();
});

test.todo('should transform code with object access', async ({ expect }) => {
  const cssLookup = new Map<string, string>();
  const { transformed, css } = await transform(objectPropertiesCss, {
    fileName: 'fixtures/objectProperties.ts',
    cssLookup,
    babelOptions: {
      filename: 'fixtures/objectProperties.ts', // TODO: set full path?
      parserOpts: {
        plugins: ['typescript'],
      },
    },
  });

  console.log(transformed);
  expect(transformed).not.toMatch(/css`/);
  console.log(css);
  expect(css).not.toBeUndefined();
});
