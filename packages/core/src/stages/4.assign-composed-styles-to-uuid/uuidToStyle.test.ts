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

test('should compose styles', async ({ expect, server, transformResult }) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/composing.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const r = transformResult[moduleId];
  assert(r);
  const { composedStyles } = r.stages[4] ?? {};
  assert(composedStyles?.length);
  for (const { style, originalName } of composedStyles) {
    switch (originalName) {
      case 'styleA': {
        expect(style).toMatch(/color: red;/);
        expect(style).not.toMatch(/font-size:;/);
        break;
      }
      case 'styleB': {
        expect(style).toMatch(/color: red;/);
        expect(style).toMatch(/font-size:/);
        expect(style).toMatch(/display:/);
        expect(style).toMatch(/border:/);
        break;
      }

      default: {
        throw new Error(`Unknown className ${originalName}`);
      }
    }
  }
});
