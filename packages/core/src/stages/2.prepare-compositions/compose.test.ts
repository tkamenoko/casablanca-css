import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

import type { ResolvedModuleId } from '@/types';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      composedCode: string;
      uuidToStylesMap: Map<
        string,
        {
          resolvedId: ResolvedModuleId | null;
          className: string;
        }
      >;
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 2,
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

  const { transformed } = transformResult;
  assert(transformed);
  expect(transformed).not.toMatch(/compose\(imported\)/);
  expect(transformed).toMatch(
    /([0-9a-f]{8})-([0-9a-f]{4})-(4[0-9a-f]{3})-([0-9a-f]{4})-([0-9a-f]{12})/,
  );
});
