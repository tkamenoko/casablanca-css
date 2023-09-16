import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { assert, beforeEach, test } from 'vitest';

import { isResolvedId } from '../../vite/isResolvedId';
import type { ModuleIdPrefix, PluginOption } from '../../types';
import { captureTaggedStyles } from '../1.capture-tagged-styles';
import { evaluateModule } from '../3.evaluate-module';
import { createVirtualCssModule } from '../4.create-virtual-css-module';
import { buildModuleId } from '../fixtures/buildModuleId';

import { notCss, styleA, styleB } from './fixtures/simple';

import { assignStylesToCapturedVariables } from '.';

export function partialPlugin(
  options?: Partial<PluginOption> & {
    transformedLookup: Map<string, string>;
  }
): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};

  return {
    name: 'macrostyles:partial',
    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!server) {
        throw new Error('Vite dev server is not running');
      }
      const serverResolved = server;

      if (!extensions.some((e) => id.endsWith(e))) {
        return;
      }
      if (/\/node_modules\//.test(id)) {
        return;
      }

      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code, options: { babelOptions } });
      if (!capturedVariableNames.length) {
        return;
      }

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        variableNames: capturedVariableNames,
        moduleId: id,
        load: async (id) => {
          const result = await serverResolved.ssrLoadModule(id);
          return result;
        },
        resolveId: async (id) => {
          const r = await this.resolve(id);
          if (!r) {
            return r;
          }
          return r.id;
        },
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: Array.from(mapOfVariableNamesToStyles.values()),
        importerId: id,
        projectRoot: config.root,
      });

      const { transformed: resultCode } = assignStylesToCapturedVariables({
        variableNames: capturedVariableNames,
        code: capturedCode,
        cssImportId: importId,
        options: { babelOptions },
      });

      options?.transformedLookup.set(id, resultCode);
      cssLookup.set(importId, style);

      return resultCode;
    },

    configResolved(config_) {
      config = config_;
    },
    configureServer(server_) {
      server = server_;
    },
    async buildStart() {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }
      if (!server) {
        const {
          configFile: _unused,
          plugins,
          assetsInclude: __unused,
          ...rest
        } = config;

        server = await createServer({
          ...rest,
          plugins: plugins.slice(),
          server: { middlewareMode: true, hmr: false },
        });
      }
    },
    async buildEnd() {
      if (config?.command !== 'serve') {
        await server?.close();
      }
    },
    resolveId(id) {
      if (isResolvedId(id)) {
        return id;
      }
      return null;
    },
    load(id) {
      if (!isResolvedId(id)) {
        return;
      }
      const found = cssLookup.get(id);

      return found;
    },
  };
}

type TestContext = {
  server: ViteDevServer;
  transformedLookup: Map<string, string>;
};

beforeEach<TestContext>(async (ctx) => {
  ctx.transformedLookup = new Map();
  const server = await createServer({
    plugins: [partialPlugin({ transformedLookup: ctx.transformedLookup })],
    server: { middlewareMode: true, hmr: false },
  });

  ctx.server = server;
  return async () => {
    await ctx.server.close();
  };
});

test<TestContext>("should replace variable initializations with `styles[xxx]`, then append `import styles from 'xxx.css'`", async ({
  expect,
  server,
  transformedLookup,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/simple.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const transformed = transformedLookup.get(moduleId);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch(styleB);
  expect(transformed).toMatch(notCss);

  const cssImportId = `macrostyles:${moduleId
    .replace(server.config.root, '')
    .slice(1)}.module.css`;
  expect(transformed).toMatch(cssImportId);
});
