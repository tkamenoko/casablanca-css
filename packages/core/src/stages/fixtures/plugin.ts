import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';

import type { PluginOption } from '@/types';
import type { CssLookup, JsToCssLookup } from '@/vite/types';
import { extractPathAndParamsFromId } from '@/vite/helpers/extractPathAndQueriesFromId';
import { resolveCssId } from '@/vite/hooks/resolveCssId';
import { loadCss } from '@/vite/hooks/loadCss';
import { buildResolvedIdFromVirtualId } from '@/vite/helpers/buildResolvedIdFromVirtualId';

import { captureTaggedStyles } from '../1.capture-tagged-styles';
import { prepareCompositions } from '../2.prepare-compositions';
import type { EvaluateModuleReturn } from '../3.evaluate-module';
import {
  evaluateForProductionBuild,
  evaluateWithServer,
} from '../3.evaluate-module';
import { replaceUuidToStyles } from '../4.assign-composed-styles-to-uuid';
import { createVirtualCssModule } from '../5.create-virtual-css-module';
import { assignStylesToCapturedVariables } from '../6.assign-styles-to-variables';

export type TransformResult<T extends Record<string, unknown>> = {
  id: string;
  transformed: string;
  cssLookup: CssLookup;
  jsToCssLookup: JsToCssLookup;
  stageResult?: T;
};

export function partialPlugin(
  options?: Partial<PluginOption> & {
    stage: 1 | 2 | 3 | 4 | 5 | 6;
    onExit?: <T extends Record<string, unknown>>(
      params: TransformResult<T>,
    ) => Promise<void>;
  },
): Plugin {
  const cssLookup: CssLookup = new Map();
  const jsToCssLookup: JsToCssLookup = new Map();

  let config: ResolvedConfig | null = null;
  let server: ViteDevServer | null = null;
  const {
    babelOptions = {},
    extensions = ['.js', '.jsx', '.ts', '.tsx'],
    stage,
    includes,
    onExit = async () => {},
  } = options ?? {};
  const include = new Set(includes ?? []);

  return {
    name: 'macrostyles:partial',
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

      const temporalVariableNames = new Map(
        [...capturedVariableNames.values()].map((v) => [v.temporalName, v]),
      );

      // replace `compose` calls to temporal strings
      const { transformed: composedCode, uuidToStylesMap } =
        await prepareCompositions({
          code: capturedCode,
          temporalVariableNames: [...temporalVariableNames.keys()],
          importSources,
          projectRoot: config.root,
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
        code: composedCode,
        temporalVariableNames,
        modulePath: path,
      });

      const { composedStyles } = replaceUuidToStyles({
        cssLookup,
        ownedClassNamesToStyles: mapOfClassNamesToStyles,
        uuidToClassNamesMap: uuidToStylesMap,
      });

      const { importId, style } = createVirtualCssModule({
        evaluatedStyles: composedStyles,
        importerPath: path,
        projectRoot: config.root,
      });

      const { transformed: resultCode } = assignStylesToCapturedVariables({
        temporalVariableNames,
        originalToTemporalMap: capturedVariableNames,
        code: composedCode,
        cssImportId: importId,
      });

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

      switch (stage) {
        case 1: {
          await onExit({
            id,
            cssLookup,
            jsToCssLookup,
            transformed: capturedCode,
            stageResult: {
              capturedVariableNames,
              transformed: capturedCode,
              importSources,
            },
          });
          break;
        }
        case 2: {
          await onExit({
            cssLookup,
            id,
            jsToCssLookup,
            transformed: composedCode,
            stageResult: { composedCode, uuidToStylesMap },
          });
          break;
        }
        case 3: {
          await onExit({
            cssLookup,
            id,
            jsToCssLookup,
            transformed: composedCode,
            stageResult: { mapOfClassNamesToStyles },
          });
          break;
        }
        case 4: {
          await onExit({
            cssLookup,
            id,
            jsToCssLookup,
            transformed: composedCode,
            stageResult: {
              composedStyles,
            },
          });
          break;
        }
        case 5: {
          await onExit({
            cssLookup,
            id,
            jsToCssLookup,
            transformed: composedCode,
            stageResult: {
              importId,
              style,
            },
          });
          break;
        }

        default: {
          await onExit({
            cssLookup,
            id,
            jsToCssLookup,
            transformed: resultCode,
            stageResult: { resultCode },
          });
          break;
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
  };
}
