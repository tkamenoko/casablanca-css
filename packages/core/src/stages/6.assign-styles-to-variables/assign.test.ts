import { assert, test as t } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

import { buildCssImportId } from '@/vite/helpers/buildCssImportId';
import { plugin, type TransformResult } from '@/vite/plugin';

import { buildModuleId } from '../fixtures/buildModuleId';

import { notCss, styleA } from './fixtures/simple';

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

test("should replace variable initializations with `styles[xxx]`, then append `import styles from 'xxx.css'`", async ({
  expect,
  server,
  transformResult,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.tsx',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const { transformed } = transformResult[moduleId] ?? {};
  assert(transformed);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch('export const styleB');
  expect(transformed).toMatch(notCss);

  const cssImportId = buildCssImportId({
    importerPath: moduleId,
    projectRoot: server.config.root,
  });
  expect(transformed).toMatch(cssImportId);
});
