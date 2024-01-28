import { assert } from 'vitest';
import { build } from 'vite';

import { buildModuleId } from '../fixtures/buildModuleId';
import { test } from '../fixtures/extendedTest';

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
  const { cssModuleImportId, style } = r.stages[5] ?? {};

  assert(cssModuleImportId && style);
  expect(style).toMatch(/\.foo *\{/);
});
