import { parseAsync } from "@babel/core";
import { extractPathAndParamsFromId } from "@casablanca/utils";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import type { CaptureTaggedStylesReturn } from "#@/stages/1.capture-tagged-styles";
import { captureTaggedStyles } from "#@/stages/1.capture-tagged-styles";
import type { PrepareCompositionsReturn } from "#@/stages/2.prepare-compositions";
import { prepareCompositions } from "#@/stages/2.prepare-compositions";
import type { EvaluateModuleReturn } from "#@/stages/3.evaluate-module";
import { createEvaluator } from "#@/stages/3.evaluate-module";
import type { ReplaceUuidToStylesReturn } from "#@/stages/4.assign-composed-styles-to-uuid";
import { replaceUuidWithStyles } from "#@/stages/4.assign-composed-styles-to-uuid";
import {
  type CreateVirtualModulesReturn,
  createVirtualModules,
} from "#@/stages/5.create-virtual-modules";
import type { AssignStylesToCapturedVariablesReturn } from "#@/stages/6.assign-styles-to-variables";
import { assignStylesToCapturedVariables } from "#@/stages/6.assign-styles-to-variables";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "./helpers/buildResolvedCssModuleIdFromVirtualCssModuleId";
import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "./helpers/buildResolvedGlobalStyleIdFromVirtualGlobalStyleId";
import { extractTargetFilePath } from "./helpers/extractTargetFilePath";
import { invalidateModules } from "./helpers/invalidateModules";
import { loadCssModule } from "./hooks/loadCss/loadCssModule";
import { loadGlobalStyle } from "./hooks/loadCss/loadGlobalStyle";
import { resolveCssModuleId } from "./hooks/resolveCss/resolveCssModuleId";
import { resolveGlobalStyleId } from "./hooks/resolveCss/resolveGlobalStyleId";
import type {
  CssModulesLookup,
  GlobalStylesLookup,
  JsToCssModuleLookup,
  JsToGlobalStyleLookup,
  PluginOption,
} from "./types";

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
    5?: CreateVirtualModulesReturn;
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
    extensions = [".mjs", ".cjs", ".js", ".jsx", ".mts", ".cts", ".ts", ".tsx"],
    onExitTransform,
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  return {
    name: "casablanca",
    async transform(code, id) {
      if (!config) {
        throw new Error("Vite config is not resolved");
      }

      const path = extractTargetFilePath({ extensions, id, include });
      if (!path) {
        return;
      }

      const isDev = config.mode === "development";

      const parsed = await parseAsync(code, {
        ...babelOptions,
        ast: true,
        sourceMaps: isDev ? "inline" : false,
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

      if (
        !(capturedVariableNames.size || capturedGlobalStylesTempNames.length)
      ) {
        return;
      }

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

      const { composedStyles } = replaceUuidWithStyles({
        cssModulesLookup,
        ownedClassNamesToStyles: mapOfClassNamesToStyles,
        uuidToStylesMap,
      });

      const { cssModule, globalStyle } = createVirtualModules({
        evaluatedCssModuleStyles: composedStyles,
        evaluatedGlobalStyles,
        importerPath: path,
        projectRoot: config.root,
      });

      const { importId: cssModuleImportId, style: cssModuleStyle } = cssModule;
      const { importId: globalStyleImportId } = globalStyle;

      const { transformed: resultCode } = await assignStylesToCapturedVariables(
        {
          cssModule: {
            importId: cssModuleImportId,
            originalToTemporalMap: capturedVariableNames,
            temporalVariableNames,
          },
          globalStyle: {
            importId: globalStyleImportId,
            temporalVariableNames: capturedGlobalStylesTempNames,
          },
          originalCode: code,
          replaced: replacedAst,
          isDev,
        },
      );

      const resolvedCssModuleId =
        buildResolvedCssModuleIdFromVirtualCssModuleId({
          id: cssModuleImportId,
        });
      cssModulesLookup.set(resolvedCssModuleId, {
        style: cssModuleStyle,
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
        style: cssModuleStyle,
      });

      const resolvedGlobalStyleId =
        buildResolvedGlobalStyleIdFromVirtualGlobalStyleId({
          id: globalStyleImportId,
        });
      globalStylesLookup.set(resolvedGlobalStyleId, {
        style: globalStyle.style,
      });
      jsToGlobalStyleLookup.set(path, {
        resolvedId: resolvedGlobalStyleId,
        style: globalStyle.style,
        virtualId: globalStyleImportId,
      });

      if (server) {
        invalidateModules({
          moduleIds: [resolvedCssModuleId, resolvedGlobalStyleId],
          server,
        });
      }

      if (onExitTransform) {
        await onExitTransform({
          cssModulesLookup,
          id,
          jsToCssModuleLookup,
          globalStylesLookup,
          jsToGlobalStyleLookup,
          stages: {
            "1": {
              capturedVariableNames,
              importSources,
              capturedGlobalStylesTempNames,
              transformed: capturedCode,
              ast: capturedAst,
            },
            "2": {
              transformed: replacedCode,
              ast: replacedAst,
              uuidToStylesMap,
            },
            "3": {
              mapOfClassNamesToStyles,
              evaluatedGlobalStyles,
            },
            "4": {
              composedStyles,
            },
            "5": { cssModule, globalStyle },
            "6": { transformed: resultCode },
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
        const { id } = m;
        if (!id) {
          return [m];
        }
        const { path } = extractPathAndParamsFromId(id);
        const { resolvedId: cssModuleId } = jsToCssModuleLookup.get(path) ?? {};
        const cssModule = cssModuleId
          ? server.moduleGraph.getModuleById(cssModuleId)
          : null;

        const { resolvedId: globalStyleId } =
          jsToGlobalStyleLookup.get(path) ?? {};
        const globalStyle = globalStyleId
          ? server.moduleGraph.getModuleById(globalStyleId)
          : null;

        return [m, cssModule, globalStyle].filter(
          (x): x is NonNullable<typeof x> => !!x,
        );
      });

      return affectedModules;
    },
  };
}
