import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

import type { CapturedVariableNames, ImportSource } from '.';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      capturedVariableNames: CapturedVariableNames;
      importSources: ImportSource[];
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 1,
          onExit: async (p) => {
            Object.assign(transformResult, p);
          },
        }),
      ],
      appType: 'custom',
      server: {
        middlewareMode: true,
        hmr: false,
        preTransformRequests: false,
      },
      optimizeDeps: {
        disabled: true,
      },
    });
    await use(server);
    return server.close();
  },
  transformResult: async ({ task: _ }, use) => {
    await use({});
  },
});

test('should capture variable names initialized with css tag', async ({
  expect,
  server,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/static.tsx',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const { capturedVariableNames } = transformResult.stageResult ?? {};
  assert(capturedVariableNames?.size);
  expect([...capturedVariableNames.entries()]).toMatchObject([
    ['style', { originalName: 'style', temporalName: expect.any(String) }],
    [
      'notExported',
      { originalName: 'notExported', temporalName: expect.any(String) },
    ],
  ]);
  const { transformed } = transformResult;
  expect(transformed).not.toMatch(/css/);
  expect(transformed).not.toMatch(/@macrostyles\/core/);

  for (const { temporalName } of capturedVariableNames.values()) {
    const regexp = new RegExp(`export const ${temporalName}`);
    expect(transformed).toMatch(regexp);
  }
});
