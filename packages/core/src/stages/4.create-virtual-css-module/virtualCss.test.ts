import type { ModuleIdPrefix, PluginOption } from 'src/types';
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { isResolvedId } from 'src/vite/isResolvedId';
import { assert, beforeEach, test } from 'vitest';

import { captureTaggedStyles } from '../1.capture-tagged-styles';
import { evaluateModule } from '../3.evaluate-module';
import { buildModuleId } from '../fixtures/buildModuleId';

import { createVirtualCssModule } from '.';

export function partialPlugin(
  options?: Partial<PluginOption> & {
    reverseLookup: Map<string, `${ModuleIdPrefix}${string}`>;
    cssLookup: Map<`${ModuleIdPrefix}${string}`, string>;
  }
): Plugin {
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

      options?.cssLookup.set(importId, style);
      options?.reverseLookup.set(style, importId);

      return style;
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
      const found = options?.cssLookup.get(id);

      return found;
    },
  };
}

type TestContext = {
  server: ViteDevServer;
  reverseLookup: Map<string, `${ModuleIdPrefix}${string}`>;
  cssLookup: Map<`${ModuleIdPrefix}${string}`, string>;
};

beforeEach<TestContext>(async (ctx) => {
  ctx.reverseLookup = new Map();
  ctx.cssLookup = new Map();
  const server = await createServer({
    plugins: [
      partialPlugin({
        reverseLookup: ctx.reverseLookup,
        cssLookup: ctx.cssLookup,
      }),
    ],
    server: { middlewareMode: true, hmr: false },
  });

  ctx.server = server;
  return async () => {
    await ctx.server.close();
  };
});

test<TestContext>('should create css string from partial styles and importer id', async ({
  expect,
  reverseLookup,
  cssLookup,
  server,
}) => {
  const moduleId = buildModuleId({
    relativePath: './fixtures/styles.ts',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const importId = reverseLookup.get(result.code);
  assert(importId);

  const stored = cssLookup.get(importId);
  expect(stored).toMatch(/\.foo *\{/);
});
