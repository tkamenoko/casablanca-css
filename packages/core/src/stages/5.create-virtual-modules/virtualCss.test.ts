import { assert } from 'vitest';
import { build } from 'vite';

import { buildModuleId } from '../fixtures/buildModuleId';
import { test } from '../fixtures/extendedTest';

// TODO: test global style!

test('should create css string from partial styles and importer id', async ({
  expect,
  transformResult,
  plugin,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/styles.ts',
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

  const r = transformResult[moduleId];
  assert(r);
  const { cssModule, globalStyle } = r.stages[5] ?? {};

  assert(cssModule?.importId && cssModule.style);
  expect(cssModule.style).toMatch(/\.foo *\{/);
});
