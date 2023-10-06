import { assert, test as t } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

import { plugin, type TransformResult } from '@/vite/plugin';

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

test('should create css string from partial styles and importer id', async ({
  expect,
  transformResult,
  server,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/styles.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { importId, style } = r.stages[5] ?? {};

  assert(importId && style);
  expect(style).toMatch(/\.foo *\{/);
});
