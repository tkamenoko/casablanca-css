import { assert, test as t } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

import type { VirtualModuleId } from '@/types';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      importId: VirtualModuleId;
      style: string;
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 5,
          onExit: async (p) => {
            Object.assign(transformResult, p);
          },
        }),
      ],
      appType: 'custom',
      server: {
        middlewareMode: true,
        hmr: false,
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

  const { importId, style } = transformResult.stageResult ?? {};

  assert(importId && style);
  expect(style).toMatch(/\.foo *\{/);
});
