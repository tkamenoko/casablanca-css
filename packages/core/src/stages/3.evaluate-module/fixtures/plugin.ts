import { type Plugin, type ResolvedConfig, type ViteDevServer } from 'vite';

import { prepareCompositions } from '@/stages/2.prepare-compositions';
import { captureTaggedStyles } from '@/stages/1.capture-tagged-styles';
import type { PluginOption } from '@/types';
import { extractPathAndParamsFromId } from '@/vite/helpers/extractPathAndQueriesFromId';

import type { EvaluateModuleReturn } from '../types';
import { evaluateForProductionBuild, evaluateWithServer } from '..';

export function partialPlugin(
  options?: Partial<PluginOption> & {
    mapOfVariableNamesToStyles: Map<
      string,
      { variableName: string; style: string }
    >;
  },
): Plugin {
  let server: ViteDevServer | null = null;

  let config: ResolvedConfig | null = null;
  const { babelOptions = {}, extensions = ['.js', '.jsx', '.ts', '.tsx'] } =
    options ?? {};
  const include = new Set(options?.includes ?? []);

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
      const {
        capturedVariableNames,
        transformed: capturedCode,
        importSources,
      } = captureTaggedStyles({ code, options: { babelOptions } });

      if (!capturedVariableNames.size) {
        return;
      }

      const variableNames = [...capturedVariableNames.keys()];

      // replace `compose` calls
      const { transformed: composedCode } = await prepareCompositions({
        code: capturedCode,
        variableNames,
        importSources,
        projectRoot: config.root,
        resolve: async (importSource) => {
          const resolved = await this.resolve(importSource, id);
          return resolved?.id ?? null;
        },
      });

      const evaluateModule: (params: {
        code: string;
        variableNames: string[];
        moduleId: string;
      }) => Promise<EvaluateModuleReturn> = server
        ? async ({ code, moduleId, variableNames }) => {
            const result = await evaluateWithServer({
              code,
              modulePath: moduleId,
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
              modulePath: moduleId,
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
        variableNames: [...capturedVariableNames.keys()],
        moduleId: id,
      });

      for (const [key, value] of mapOfVariableNamesToStyles) {
        options?.mapOfVariableNamesToStyles.set(key, value);
      }
      return capturedCode;
    },

    configResolved(config_) {
      config = config_;
    },
    configureServer(server_) {
      server = server_;
    },
  };
}
