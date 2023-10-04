import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import type { EvaluateModuleReturn } from '@/stages/3.evaluate-module';
import { assignStylesToCapturedVariables } from '@/stages/6.assign-styles-to-variables';
import { createVirtualCssModule } from '@/stages/5.create-virtual-css-module';
import type { ResolvedModuleId, PluginOption, VirtualModuleId } from '@/types';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '@/stages/3.evaluate-module';
import { captureTaggedStyles } from '@/stages/1.capture-tagged-styles';
import { prepareCompositions } from '@/stages/2.prepare-compositions';
import { replaceUuidToStyles } from '@/stages/4.assign-composed-styles-to-uuid';

import { loadCss } from './hooks/loadCss';
import { resolveCssId } from './hooks/resolveCssId';
import { extractPathAndParamsFromId } from './helpers/extractPathAndQueriesFromId';
import type { CssLookup } from './types';
import { buildResolvedIdFromVirtualId } from './helpers/buildResolvedIdFromVirtualId';

export function macrostyles(options?: Partial<PluginOption>): Plugin {
  const cssLookup: CssLookup = new Map();
  const jsToCssLookup = new Map<
    string,
    { virtualId: VirtualModuleId; resolvedId: ResolvedModuleId; style: string }
  >();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};
  const include = new Set(options?.includes ?? []);

  return {
    name: 'macrostyles',
    async transform(code, id) {
      if (!config) {
        throw new Error('Vite config is not resolved');
      }

      const { path, queries } = extractPathAndParamsFromId(id);
      if (queries.has('raw')) {
        return;
      }
      if (!(include.has(path) || extensions.some((e) => path.endsWith(e)))) {
        // ignore module that is not JS/TS code
        return;
      }
      if (/\/node_modules\//.test(path)) {
        // ignore third party packages
        return;
      }

      // TODO: library-specific hooks

      // find tagged templates, then remove all tags.
      const {
        capturedVariableNames,
        transformed: capturedCode,
        importSources,
      } = captureTaggedStyles({ code, options: { babelOptions } });
      if (!capturedVariableNames.size) {
        return;
      }

      const variableNames = [...capturedVariableNames.keys()];

      // replace `compose` calls to temporal strings
      const { transformed: composedCode, uuidToStylesMap } =
        await prepareCompositions({
          code: capturedCode,
          variableNames,
          importSources,
          projectRoot: config.root,
          resolve: async (importSource) => {
            const resolved = await this.resolve(importSource, path);
            return resolved?.id ?? null;
          },
        });

      const evaluateModule: (params: {
        code: string;
        variableNames: string[];
        modulePath: string;
      }) => Promise<EvaluateModuleReturn> = server
        ? async ({ code, modulePath, variableNames }) => {
            const result = await evaluateWithServer({
              code,
              modulePath,
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
        : async ({ code, modulePath, variableNames }) => {
            const result = await evaluateForProductionBuild({
              code,
              modulePath,
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
        code: composedCode,
        variableNames,
        modulePath: path,
      });

      const { composedStyles } = replaceUuidToStyles({
        cssLookup,
        ownedVariablesToStyles: mapOfVariableNamesToStyles,
        uuidToClassNamesMap: uuidToStylesMap,
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: composedStyles,
        importerPath: path,
        projectRoot: config.root,
      });

      const { transformed: resultCode } = assignStylesToCapturedVariables({
        variableNames: capturedVariableNames,
        code: capturedCode,
        cssImportId: importId,
        options: { babelOptions },
      });

      const resolvedId = buildResolvedIdFromVirtualId({ id: importId });
      cssLookup.set(resolvedId, {
        style,
        classNameToStyleMap: new Map(
          composedStyles.map(({ style, variableName }) => [
            variableName,
            { style, className: variableName },
          ]),
        ),
      });
      jsToCssLookup.set(path, { resolvedId, virtualId: importId, style });

      if (server) {
        const m = server.moduleGraph.getModuleById(resolvedId);
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
      return resolveCssId({ id });
    },
    load(id) {
      return loadCss({ cssLookup, id });
    },
    handleHotUpdate({ modules, server }) {
      const affectedModules = modules.flatMap((m) => {
        const { id } = m;
        if (!id) {
          return m;
        }
        const { path } = extractPathAndParamsFromId(id);
        const css = jsToCssLookup.get(path);
        if (!css) {
          return m;
        }
        const cssModule = server.moduleGraph.getModuleById(css.resolvedId);
        if (!cssModule) {
          return m;
        }
        return [m, cssModule];
      });

      return affectedModules;
    },
  };
}
