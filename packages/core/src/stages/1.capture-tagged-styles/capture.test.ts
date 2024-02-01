import { build } from 'vite';
import { assert } from 'vitest';

import { buildModuleId } from '../fixtures/buildModuleId';
import { test } from '../fixtures/extendedTest';

test('should capture variable names initialized with css tag', async ({
  expect,
  plugin,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/static.tsx',
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
  const { capturedVariableNames, transformed, capturedGlobalStylesTempNames } =
    r.stages[1] ?? {};

  expect(capturedGlobalStylesTempNames?.length).toEqual(2);

  assert(capturedVariableNames?.size);
  expect([...capturedVariableNames.entries()]).toMatchObject([
    ['style', { originalName: 'style', temporalName: expect.any(String) }],
    [
      'notExported',
      { originalName: 'notExported', temporalName: expect.any(String) },
    ],
  ]);

  assert(transformed);
  expect(transformed).not.toMatch(/css/);
  expect(transformed).not.toMatch(/@macrostyles\/core/);

  for (const { temporalName } of capturedVariableNames.values()) {
    const regexp = new RegExp(`export const ${temporalName}`);
    expect(transformed).toMatch(regexp);
  }
});
