import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

import type { TransformResult } from '@/vite/plugin';
import { plugin } from '@/vite/plugin';

import { buildModuleId } from '../fixtures/buildModuleId';

type TestContext = {
  server: ViteDevServer;
  transformResult: Record<string, TransformResult>;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        plugin({
          onExitTransform: async (p) => {
            transformResult[p.id] = p;
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

  const r = transformResult[moduleId];
  assert(r);
  const { capturedVariableNames, transformed } = r.stages[1] ?? {};
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
