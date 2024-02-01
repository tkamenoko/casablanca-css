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

  const { transformed, jsToCssModuleLookup } = transformResult[moduleId] ?? {};
  assert(transformed && jsToCssModuleLookup);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch('export const styleB');
  expect(transformed).toMatch(notCss);

  assert(jsToCssModuleLookup.has(moduleId));
});

test('should remove temporal variables, import global styles', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/globalOnly.ts',
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

  const { transformed, jsToGlobalStyleLookup } =
    transformResult[moduleId] ?? {};
  assert(transformed && jsToGlobalStyleLookup);

  assert(transformed);
  expect(transformed).not.toMatch('box-sizing');
  assert(jsToGlobalStyleLookup.has(moduleId));
});

test('should work with a file using both `css` and `injectGlobal`', async ({
  expect,
  transformResult,
  plugin,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/mixed.ts',
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

  const { transformed, jsToGlobalStyleLookup, jsToCssModuleLookup } =
    transformResult[moduleId] ?? {};
  assert(transformed && jsToGlobalStyleLookup && jsToCssModuleLookup);

  assert(transformed);
  expect(transformed).not.toMatch('aliceblue');
  expect(transformed).not.toMatch('box-sizing');

  assert(jsToCssModuleLookup.has(moduleId));
  assert(jsToGlobalStyleLookup.has(moduleId));
});
