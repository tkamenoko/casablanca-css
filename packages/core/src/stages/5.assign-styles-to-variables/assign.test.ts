import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { assert, beforeEach, test } from 'vitest';

import { isVirtualModuleId } from '../../vite/isVirtualModuleId';
import { isResolvedId } from '../../vite/isResolvedId';
import {
  moduleIdPrefix,
  resolvedPrefix,
  type ModuleIdPrefix,
  type PluginOption,
} from '../../types';
import { captureTaggedStyles } from '../1.capture-tagged-styles';
import type { EvaluateModuleReturn } from '../3.evaluate-module';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '../3.evaluate-module';
import { createVirtualCssModule } from '../4.create-virtual-css-module';
import { buildModuleId } from '../fixtures/buildModuleId';

import { notCss, styleA } from './fixtures/simple';

import { assignStylesToCapturedVariables } from '.';

function partialPlugin(
  options?: Partial<PluginOption> & {
    transformedLookup: Map<string, string>;
  },
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

      const found = cssLookup.get(moduleId);

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
    optimizeDeps: { disabled: true },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
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
    relativePath: './fixtures/simple.tsx',
    root: import.meta.url,
  });
  const result = await server.transformRequest(moduleId);
  assert(result);

  const transformed = transformedLookup.get(moduleId);

  assert(transformed);
  expect(transformed).not.toMatch(styleA);
  expect(transformed).not.toMatch('export const styleB');
  expect(transformed).toMatch(notCss);

  const cssImportId = `${moduleIdPrefix}${moduleId
    .replace(server.config.root, '')
    .slice(1)}.module.css`;
  expect(transformed).toMatch(cssImportId);
});
