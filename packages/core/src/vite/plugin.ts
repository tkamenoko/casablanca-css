import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { parseAsync } from '@babel/core';
import { extractPathAndParamsFromId } from '@macrostyles/utils';

import type { EvaluateModuleReturn } from '@/stages/3.evaluate-module';
import type { AssignStylesToCapturedVariablesReturn } from '@/stages/6.assign-styles-to-variables';
import { assignStylesToCapturedVariables } from '@/stages/6.assign-styles-to-variables';
import type { CreateVirtualCssModuleReturn } from '@/stages/5.create-virtual-css-module';
import { createVirtualCssModule } from '@/stages/5.create-virtual-css-module';
import { createEvaluator } from '@/stages/3.evaluate-module';
import type { CaptureTaggedStylesReturn } from '@/stages/1.capture-tagged-styles';
import { captureTaggedStyles } from '@/stages/1.capture-tagged-styles';
import type { PrepareCompositionsReturn } from '@/stages/2.prepare-compositions';
import { prepareCompositions } from '@/stages/2.prepare-compositions';
import type { ReplaceUuidToStylesReturn } from '@/stages/4.assign-composed-styles-to-uuid';
import { replaceUuidToStyles } from '@/stages/4.assign-composed-styles-to-uuid';

import { loadCssModule } from './hooks/loadCss/loadCssModule';
import type {
  CssModulesLookup,
  GlobalStylesLookup,
  JsToCssModuleLookup,
  JsToGlobalStyleLookup,
  PluginOption,
} from './types';
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from './helpers/buildResolvedCssModuleIdFromVirtualCssModuleId';
import { resolveCssModuleId } from './hooks/resolveCss/resolveCssModuleId';
import { resolveGlobalStyleId } from './hooks/resolveCss/resolveGlobalStyleId';
import { loadGlobalStyle } from './hooks/loadCss/loadGlobalStyle';

export type TransformResult = {
  id: string;
  transformed: string;
  cssModulesLookup: CssModulesLookup;
  jsToCssModuleLookup: JsToCssModuleLookup;
  globalStylesLookup: GlobalStylesLookup;
  jsToGlobalStyleLookup: JsToGlobalStyleLookup;
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
  const cssModulesLookup: CssModulesLookup = new Map();
  const jsToCssModuleLookup: JsToCssModuleLookup = new Map();

  const globalStylesLookup: GlobalStylesLookup = new Map();
  const jsToGlobalStyleLookup: JsToGlobalStyleLookup = new Map();

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

      // find tagged templates, then remove all tags.
      const {
        capturedVariableNames,
        capturedGlobalStylesTempNames,
        transformed: capturedCode,
        ast: capturedAst,
        importSources,
      } = await captureTaggedStyles({ code, ast: parsed, isDev });

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

      const evaluateModule = createEvaluator({
        server,
        transformContext: this,
        modulePath: path,
      });

      const { mapOfClassNamesToStyles, evaluatedGlobalStyles } =
        await evaluateModule({
          code: replacedCode,
          temporalVariableNames,
          temporalGlobalStyles: capturedGlobalStylesTempNames,
          uuidToStylesMap,
        });

      const { composedStyles } = replaceUuidToStyles({
        cssModulesLookup,
        ownedClassNamesToStyles: mapOfClassNamesToStyles,
        uuidToStylesMap,
      });

      const { cssModuleImportId, style } = createVirtualCssModule({
        evaluatedStyles: composedStyles,
        importerPath: path,
        projectRoot: config.root,
      });
      // TODO: create virtual global style

      // TODO: remove unused variables used for global styles
      const { transformed: resultCode } = await assignStylesToCapturedVariables(
        {
          temporalVariableNames,
          originalToTemporalMap: capturedVariableNames,
          originalCode: code,
          replaced: replacedAst,
          cssModuleImportId,
          isDev,
        },
      );

      // TODO: register global style
      const resolvedCssModuleId =
        buildResolvedCssModuleIdFromVirtualCssModuleId({
          id: cssModuleImportId,
        });
      cssModulesLookup.set(resolvedCssModuleId, {
        style,
        classNameToStyleMap: new Map(
          composedStyles.map(({ style, originalName }) => [
            originalName,
            { style, className: originalName },
          ]),
        ),
      });
      jsToCssModuleLookup.set(path, {
        resolvedId: resolvedCssModuleId,
        virtualId: cssModuleImportId,
        style,
      });

      if (server) {
        const m = server.moduleGraph.getModuleById(resolvedCssModuleId);
        if (m) {
          server.moduleGraph.invalidateModule(m);
          m.lastHMRTimestamp = m.lastInvalidationTimestamp || Date.now();
        }
      }

      if (onExitTransform) {
        await onExitTransform({
          cssModulesLookup,
          id,
          jsToCssModuleLookup,
          globalStylesLookup,
          jsToGlobalStyleLookup,
          stages: {
            '1': {
              capturedVariableNames,
              importSources,
              capturedGlobalStylesTempNames,
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
              evaluatedGlobalStyles,
            },
            '4': {
              composedStyles,
            },
            '5': { cssModuleImportId, style },
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
      return resolveCssModuleId({ id }) ?? resolveGlobalStyleId({ id });
    },
    load(id) {
      return (
        loadCssModule({ cssModulesLookup, id }) ??
        loadGlobalStyle({ globalStylesLookup, id })
      );
    },
    handleHotUpdate({ modules, server }) {
      const affectedModules = modules.flatMap((m) => {
        const dependencies = [m];
        const { id } = m;
        if (!id) {
          return dependencies;
        }
        const { path } = extractPathAndParamsFromId(id);
        const { resolvedId: cssModuleId } = jsToCssModuleLookup.get(path) ?? {};
        if (cssModuleId) {
          const cssModule = server.moduleGraph.getModuleById(cssModuleId);
          if (cssModule) {
            dependencies.push(cssModule);
          }
        }
        const { resolvedId: globalStyleId } =
          jsToGlobalStyleLookup.get(path) ?? {};
        if (globalStyleId) {
          const globalStyle = server.moduleGraph.getModuleById(globalStyleId);
          if (globalStyle) {
            dependencies.push(globalStyle);
          }
        }
        return dependencies;
      });

      return affectedModules;
    },
  };
}
