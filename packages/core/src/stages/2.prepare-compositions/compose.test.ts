import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

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

test('should replace `compose` call with `composes: ...;` expressions', async ({
  expect,
  server,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/composing.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);

  const { transformed } = r.stages[2] ?? {};
  assert(transformed);
  expect(transformed).not.toMatch(/compose\(imported\)/);
  expect(transformed).toMatch(
    /([0-9a-f]{8})-([0-9a-f]{4})-(4[0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})/,
  );
});
