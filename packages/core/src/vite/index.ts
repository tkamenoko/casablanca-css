import { readFile } from 'node:fs/promises';

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
  const jsToCssLookup = new Map<string, `${ModuleIdPrefix}${string}`>();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};
  const include = new Set(options?.includes ?? []);

  return {
    name: 'macrostyles',
    async transform(code, url) {
      const [id, ...qs] = url.split('?');
      const query = new URLSearchParams(qs.join('?'));
      if (query.has('raw')) {
        return;
      }

      if (!id) {
        return;
      }
      if (!config) {
        throw new Error('Vite config is not resolved');
      }

      if (!(include.has(id) || extensions.some((e) => id.endsWith(e)))) {
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
      const dependencies: string[] = [];
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
                dependencies.includes(importingId)
                  ? null
                  : dependencies.push(importingId);
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
                dependencies.includes(importingId)
                  ? null
                  : dependencies.push(importingId);
                return result.code;
              },
            });
            return result;
          };

      let evaluationTarget = capturedCode;
      if (server && this.meta.watchMode && code.includes('import.meta.hot')) {
        hmrOnly: {
          const m = server.moduleGraph.getModuleById(id);
          if (!m?.file) {
            break hmrOnly;
          }
          const rawContent = await readFile(m.file, { encoding: 'utf8' }).catch(
            () => null,
          );
          if (!rawContent) {
            break hmrOnly;
          }

          const c = await transformWithEsbuild(rawContent, id, {
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

      const { mapOfVariableNamesToStyles } = await evaluateModule({
        code: evaluationTarget,
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

      cssLookup.set(importId, style);
      jsToCssLookup.set(id, importId);
      if (server) {
        const m = server.moduleGraph.getModuleById(resolvedPrefix + importId);
        if (m) {
          server.moduleGraph.invalidateModule(m);
          m.lastHMRTimestamp = m.lastInvalidationTimestamp || Date.now();
        }
      }

      return {
        code: resultCode,
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
    handleHotUpdate({ modules, server }) {
      const affectedModules = modules.flatMap((m) => {
        const [id] = m.id?.split('?', 1) ?? [];
        const cssId = jsToCssLookup.get(id ?? '');
        if (!cssId) {
          return m;
        }
        const cssModule = server.moduleGraph.getModuleById(
          resolvedPrefix + cssId,
        );
        if (!cssModule) {
          return m;
        }
        return [m, cssModule];
      });

      return affectedModules;
    },
  };
}
