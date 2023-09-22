import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { transformWithEsbuild } from 'vite';

import { createVirtualCssModule } from '../stages/4.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../stages/5.assign-styles-to-variables';
import type { EvaluateModuleReturn } from '../stages/3.evaluate-module';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '../stages/3.evaluate-module';
import { captureTaggedStyles } from '../stages/1.capture-tagged-styles';
import type { PluginOption, ModuleIdPrefix } from '../types';

import { isResolvedId } from './isResolvedId';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};

  return {
    name: 'macrostyles',
    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }

      if (!extensions.some((e) => id.endsWith(e))) {
        // ignore module that is not JS/TS code
        return;
      }
      if (/\/node_modules\//.test(id)) {
        // ignore third party packages
        return;
      }

      let targetCode = code;
      if (server && this.meta.watchMode) {
        const m = server.moduleGraph.getModuleById(id);
        if (!m) {
          return;
        }
        const r = await server.ssrLoadModule(`${m.url}?raw`);
        // eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/prefer-optional-chain
        const raw = r['default'];
        if (!raw) {
          return;
        }
        const c = await transformWithEsbuild(raw, id, {
          format: 'esm',
          platform: 'node',
        });
        targetCode = c.code;
      }

      // find tagged templates, then remove all tags.
      const { capturedVariableNames, transformed: capturedCode } =
        captureTaggedStyles({ code: targetCode, options: { babelOptions } });
      if (!capturedVariableNames.length) {
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

      let mapOfVariableNamesToStyles: Map<
        string,
        {
          variableName: string;
          style: string;
        }
      >;
      try {
        const { mapOfVariableNamesToStyles: map_ } = await evaluateModule({
          code: capturedCode,
          variableNames: capturedVariableNames,
          moduleId: id,
        });
        mapOfVariableNamesToStyles = map_;
      } catch (error) {
        return;
      }

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

      cssLookup.set(importId, style);
      if (server) {
        const createdCssModule = server.moduleGraph.getModuleById(importId);
        if (createdCssModule) {
          server.moduleGraph.invalidateModule(createdCssModule);
        }
      }
      return resultCode;
    },
    configResolved(config_) {
      config = config_;
    },
    async configureServer(server_) {
      server = server_;
    },
    resolveId(id) {
      if (isResolvedId(id)) {
        return id;
      }
      return null;
    },
    load(id) {
      const normalizedId = id.replace(/\?.*/, '');
      if (!isResolvedId(normalizedId)) {
        return;
      }

      const found = cssLookup.get(normalizedId);

      return found;
    },
  };
}
