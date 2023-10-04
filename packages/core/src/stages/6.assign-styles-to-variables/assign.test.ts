import { assert, test as t } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

import { buildCssImportId } from '@/vite/helpers/buildCssImportId';

import { partialPlugin, type TransformResult } from '../fixtures/plugin';
import { buildModuleId } from '../fixtures/buildModuleId';

import { notCss, styleA } from './fixtures/simple';

type TestContext = {
  server: ViteDevServer;
  transformResult: Partial<
    TransformResult<{
      resultCode: string;
    }>
  >;
};

const test = t.extend<TestContext>({
  server: async ({ transformResult }, use) => {
    const server = await createServer({
      plugins: [
        partialPlugin({
          stage: 6,
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

  const { transformed } = transformResult;
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
