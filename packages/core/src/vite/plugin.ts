import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { parseAsync } from '@babel/core';

import type { EvaluateModuleReturn } from '@/stages/3.evaluate-module';
import type { AssignStylesToCapturedVariablesReturn } from '@/stages/6.assign-styles-to-variables';
import { assignStylesToCapturedVariables } from '@/stages/6.assign-styles-to-variables';
import type { CreateVirtualCssModuleReturn } from '@/stages/5.create-virtual-css-module';
import { createVirtualCssModule } from '@/stages/5.create-virtual-css-module';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '@/stages/3.evaluate-module';
import type { CaptureTaggedStylesReturn } from '@/stages/1.capture-tagged-styles';
import { captureTaggedStyles } from '@/stages/1.capture-tagged-styles';
import type { PrepareCompositionsReturn } from '@/stages/2.prepare-compositions';
import { prepareCompositions } from '@/stages/2.prepare-compositions';
import type { ReplaceUuidToStylesReturn } from '@/stages/4.assign-composed-styles-to-uuid';
import { replaceUuidToStyles } from '@/stages/4.assign-composed-styles-to-uuid';

import { loadCss } from './hooks/loadCss';
import { resolveCssId } from './hooks/resolveCssId';
import { extractPathAndParamsFromId } from './helpers/extractPathAndQueriesFromId';
import type { CssLookup, JsToCssLookup, PluginOption } from './types';
import { buildResolvedIdFromVirtualId } from './helpers/buildResolvedIdFromVirtualId';

export type TransformResult = {
  id: string;
  transformed: string;
  cssLookup: CssLookup;
  jsToCssLookup: JsToCssLookup;
  stages: {
    1?: CaptureTaggedStylesReturn;
    2?: PrepareCompositionsReturn;
    3?: EvaluateModuleReturn;
    4?: ReplaceUuidToStylesReturn;
    5?: CreateVirtualCssModuleReturn;
    6?: AssignStylesToCapturedVariablesReturn;
  };
};

type OnExitTransform = (params: TransformResult) => Promise<void>;

export function plugin(
  options?: Partial<PluginOption> & {
    onExitTransform?: OnExitTransform;
  },
): Plugin {
  const cssLookup: CssLookup = new Map();
  const jsToCssLookup: JsToCssLookup = new Map();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const {
    babelOptions = {},
    extensions = ['.js', '.jsx', '.ts', '.tsx'],
    onExitTransform,
  } = options ?? {};
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

      const isDev = config.mode === 'development';

      const parsed = await parseAsync(code, {
        ...babelOptions,
        ast: true,
        sourceMaps: isDev ? 'inline' : false,
      });

      if (!parsed) {
        return;
      }

      // TODO: library-specific hooks

      // find tagged templates, then remove all tags.
      const {
        capturedVariableNames,
        transformed: capturedCode,
        ast: capturedAst,
        importSources,
      } = await captureTaggedStyles({ code, ast: parsed, isDev });
      if (!capturedVariableNames.size) {
        return;
      }

      const temporalVariableNames = new Map(
        [...capturedVariableNames.values()].map((v) => [v.temporalName, v]),
      );

      // replace `compose` calls to temporal strings
      const {
        transformed: replacedCode,
        uuidToStylesMap,
        ast: replacedAst,
      } = await prepareCompositions({
        captured: capturedAst,
        code: capturedCode,
        temporalVariableNames: [...temporalVariableNames.keys()],
        importSources,
        projectRoot: config.root,
        isDev,
        resolve: async (importSource) => {
          const resolved = await this.resolve(importSource, path);
          return resolved?.id ?? null;
        },
      });

      const evaluateModule: (params: {
        code: string;
        temporalVariableNames: Map<
          string,
          {
            originalName: string;
            temporalName: string;
          }
        >;
        modulePath: string;
      }) => Promise<EvaluateModuleReturn> = server
        ? async ({ code, modulePath, temporalVariableNames }) => {
            const result = await evaluateWithServer({
              code,
              modulePath,
              temporalVariableNames,
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
        : async ({ code, modulePath, temporalVariableNames }) => {
            const result = await evaluateForProductionBuild({
              code,
              modulePath,
              temporalVariableNames,
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

      const { mapOfClassNamesToStyles } = await evaluateModule({
        code: replacedCode,
        temporalVariableNames,
        modulePath: path,
      });

      const { composedStyles } = replaceUuidToStyles({
        cssLookup,
        ownedClassNamesToStyles: mapOfClassNamesToStyles,
        uuidToStylesMap,
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: composedStyles,
        importerPath: path,
        projectRoot: config.root,
      });

      const { transformed: resultCode } = await assignStylesToCapturedVariables(
        {
          temporalVariableNames,
          originalToTemporalMap: capturedVariableNames,
          originalCode: code,
          replaced: replacedAst,
          cssImportId: importId,
          isDev,
        },
      );

      const resolvedId = buildResolvedIdFromVirtualId({ id: importId });
      cssLookup.set(resolvedId, {
        style,
        classNameToStyleMap: new Map(
          composedStyles.map(({ style, originalName }) => [
            originalName,
            { style, className: originalName },
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

      if (onExitTransform) {
        await onExitTransform({
          cssLookup,
          id,
          jsToCssLookup,
          stages: {
            '1': {
              capturedVariableNames,
              importSources,
              transformed: capturedCode,
              ast: capturedAst,
            },
            '2': {
              transformed: replacedCode,
              ast: replacedAst,
              uuidToStylesMap,
            },
            '3': {
              mapOfClassNamesToStyles,
            },
            '4': {
              composedStyles,
            },
            '5': { importId, style },
            '6': { transformed: resultCode },
          },
          transformed: resultCode,
        });
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
