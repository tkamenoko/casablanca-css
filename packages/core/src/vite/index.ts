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
import {
  type PluginOption,
  type ModuleIdPrefix,
  resolvedPrefix,
} from '../types';

import { isResolvedId } from './isResolvedId';
import { isVirtualModuleId } from './isVirtualModuleId';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  const cssLookup = new Map<`${ModuleIdPrefix}${string}`, string>();
  const jsToCssMap = new Map<string, `${ModuleIdPrefix}${string}`>();

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

      // find tagged templates, then remove all tags.
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

      let evaluationTarget = capturedCode;
      if (server && this.meta.watchMode) {
        hmrOnly: {
          const m = server.moduleGraph.getModuleById(id);
          if (!m) {
            break hmrOnly;
          }

          const r = await server
            .ssrLoadModule(`${m.url}?raw`)
            .catch(() => null);
          if (!r) {
            break hmrOnly;
          }
          // eslint-disable-next-line @typescript-eslint/dot-notation, @typescript-eslint/prefer-optional-chain
          const raw = r['default'];
          if (typeof raw !== 'string') {
            break hmrOnly;
          }
          const c = await transformWithEsbuild(raw, id, {
            format: 'esm',
            platform: 'node',
          });

          const { transformed: ssrEvaluationTarget } = captureTaggedStyles({
            code: c.code,
            options: { babelOptions },
          });
          evaluationTarget = ssrEvaluationTarget;
        }
      }

      let mapOfVariableNamesToStyles: Map<
        string,
        {
          variableName: string;
          style: string;
        }
      >;
      try {
        const { mapOfVariableNamesToStyles: map_ } = await evaluateModule({
          code: evaluationTarget,
          variableNames: [...capturedVariableNames.keys()],
          moduleId: id,
        });
        mapOfVariableNamesToStyles = map_;
      } catch (error) {
        console.log(error);

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

      const previousCss = cssLookup.get(importId);
      cssLookup.set(importId, style);
      jsToCssMap.set(id, importId);
      if (server && previousCss && previousCss !== style) {
        const m = server.moduleGraph.getModuleById(resolvedPrefix + importId);
        if (m) {
          server.reloadModule(m);
        }
      }

      return {
        code: resultCode,
        moduleSideEffects: false,
      };
    },
    configResolved(config_) {
      config = config_;
    },
    async configureServer(server_) {
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
      if (!found) {
        return;
      }
      return { code: found, moduleSideEffects: false };
    },
  };
}
