import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { assert, beforeEach, test } from 'vitest';

import { isVirtualModuleId } from '../../vite/isVirtualModuleId';
import {
  resolvedPrefix,
  type ModuleIdPrefix,
  type PluginOption,
} from '../../types';
import { isResolvedId } from '../../vite/isResolvedId';
import { captureTaggedStyles } from '../1.capture-tagged-styles';
import type { EvaluateModuleReturn } from '../3.evaluate-module';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '../3.evaluate-module';
import { buildModuleId } from '../fixtures/buildModuleId';

import { createVirtualCssModule } from '.';

function partialPlugin(
  options?: Partial<PluginOption> & {
    reverseLookup: Map<string, `${ModuleIdPrefix}${string}`>;
    cssLookup: Map<`${ModuleIdPrefix}${string}`, string>;
  },
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

      if (!extensions.some((e) => id.endsWith(e))) {
        return;
      }
      if (/\/node_modules\//.test(id)) {
        return;
      }

      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code, options: { babelOptions } });
      if (!capturedVariableNames.size) {
        return;
      }

      const evaluateModule: (params: {
        code: string;
        variableNames: string[];
        moduleId: string;
      }) => Promise<EvaluateModuleReturn> = server
        ? async ({ code, moduleId, variableNames }) => {
            const result = await evaluateWithServer({
              code,
              moduleId,
              variableNames,
              load: async (importingId) => {
                if (!server) {
                  throw new Error('Server is not configured.');
                }
                const r = await server.ssrLoadModule(importingId);
                return r;
              },
              resolveId: async (importingId) => {
                const r = await this.resolve(importingId);
                if (!r) {
                  return r;
                }
                return r.id;
              },
            });
            return result;
          }
        : async ({ code, moduleId, variableNames }) => {
            const result = await evaluateForProductionBuild({
              code,
              moduleId,
              variableNames,
              load: async (importingId) => {
                const resolved = await this.resolve(importingId);
                if (!resolved?.id) {
                  throw new Error(`Failed to resolve ${importingId}`);
                }

                const result = await this.load({
                  id: resolved.id,
                  resolveDependencies: true,
                });
                if (!result.code) {
                  throw new Error(`Failed to load ${resolved.id}`);
                }

                return result.code;
              },
            });
            return result;
          };

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: capturedCode,
        variableNames: [...capturedVariableNames.keys()],
        moduleId: id,
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

    resolveId(id) {
      if (isVirtualModuleId(id)) {
        return resolvedPrefix + id;
      }
      return null;
    },
    load(id) {
      const normalizedId = id.replace(/\?.*/, '');
      if (!isResolvedId(normalizedId)) {
        return;
      }
      const moduleId = normalizedId.slice(resolvedPrefix.length);
      if (!isVirtualModuleId(moduleId)) {
        return;
      }

      const found = options?.cssLookup.get(moduleId);

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
    appType: 'custom',
    optimizeDeps: { disabled: true },
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
