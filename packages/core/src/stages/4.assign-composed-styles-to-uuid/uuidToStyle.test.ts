import { createServer, type ViteDevServer } from 'vite';
import { assert, test as t } from 'vitest';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      composedStyles: {
        variableName: string;
        style: string;
      }[];
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 4,
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

test('should compose styles', async ({ expect, server, transformResult }) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/composing.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const { composedStyles } = transformResult.stageResult ?? {};
  assert(composedStyles?.length);
  for (const { style, variableName } of composedStyles) {
    switch (variableName) {
      case 'styleA': {
        expect(style).toMatch(/color: red;/);
        expect(style).not.toMatch(/font-size: .+;/);
        break;
      }
      case 'styleB': {
        expect(style).toMatch(/color: red;/);
        expect(style).toMatch(/font-size: .+;/);
        expect(style).toMatch(/display: flex;/);
        expect(style).toMatch(/border: .+;/);
        break;
      }

      default: {
        throw new Error(`Unknown className ${variableName}`);
      }
    }
  }
});
