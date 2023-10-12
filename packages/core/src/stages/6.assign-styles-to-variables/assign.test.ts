import { assert } from 'vitest';
import { build } from 'vite';

import { buildModuleId } from '../fixtures/buildModuleId';
import { test } from '../fixtures/extendedTest';

import { notCss, styleA } from './fixtures/simple';

test("should replace variable initializations with `styles[xxx]`, then append `import styles from 'xxx.css'`", async ({
  expect,
  plugin,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.tsx',
    root: import.meta.url,
  });
  await build({
    configFile: false,
    appType: 'custom',
    plugins: [plugin],
    build: {
      write: false,
      lib: { entry: moduleId, formats: ['es'] },
    },
    optimizeDeps: { disabled: true },
  });

  const { transformed, jsToCssLookup } = transformResult[moduleId] ?? {};
  assert(transformed && jsToCssLookup);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch('export const styleB');
  expect(transformed).toMatch(notCss);

  assert(jsToCssLookup.has(moduleId));
});
