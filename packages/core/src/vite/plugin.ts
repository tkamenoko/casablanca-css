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
import { extractTargetFilePath } from "./helpers/extractTargetFilePath";
import { invalidateModule } from "./helpers/invalidateModule";
import { loadCssModule } from "./hooks/loadCss/loadCssModule";
import { loadGlobalStyle } from "./hooks/loadCss/loadGlobalStyle";
import { resolveCssModuleId } from "./hooks/resolveCss/resolveCssModuleId";
import { resolveGlobalStyleId } from "./hooks/resolveCss/resolveGlobalStyleId";
import { buildResolvedCssModuleIdFromVirtualCssModuleId } from "./resolvedCssModuleId";
import { buildResolvedGlobalStyleIdFromVirtualGlobalStyleId } from "./resolvedGlobalStyleId";
import type {
  CssModulesLookup,
  GlobalStylesLookup,
  JsToCssModuleLookup,
  JsToGlobalStyleLookup,
  PluginOption,
} from "./types";
import type { VirtualCssModuleId } from "./virtualCssModuleId";
import type { VirtualGlobalStyleId } from "./virtualGlobalStyleId";

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
    onExitTransform = () => {},
  } = options ?? {};
  const include = new Set(options?.includes ?? []);

  const registerCssModule = ({
    virtualId,
    style,
    classNameToStyle,
    map,
    path,
  }: {
    virtualId: VirtualCssModuleId;
    style: string;
    classNameToStyle: Map<string, { style: string }>;
    map: string | null;
    path: string;
  }): void => {
    const resolvedId = buildResolvedCssModuleIdFromVirtualCssModuleId({
      id: virtualId,
    });
    cssModulesLookup.set(resolvedId, {
      style,
      classNameToStyleMap: classNameToStyle,
      map,
    });
    jsToCssModuleLookup.set(path, {
      resolvedId,
      virtualId,
      style,
    });
    if (server) {
      invalidateModule({ moduleId: resolvedId, server });
    }
  };

  const registerGlobalStyle = ({
    virtualId,
    style,
    path,
  }: {
    virtualId: VirtualGlobalStyleId;
    style: string;
    path: string;
  }): void => {
    const resolvedId = buildResolvedGlobalStyleIdFromVirtualGlobalStyleId({
      id: virtualId,
    });
    globalStylesLookup.set(resolvedId, {
      style,
    });
    jsToGlobalStyleLookup.set(path, {
      resolvedId,
      virtualId,
      style,
    });
    if (server) {
      invalidateModule({ moduleId: resolvedId, server });
    }
  };

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
      const stage1Result = await captureTaggedStyles({
        ast: parsed,
        isDev,
        filename: path,
      });

      if (!stage1Result) {
        return;
      }

      const {
        capturedVariableNames,
        capturedGlobalStylesTempNames,
        ast: stage1CapturedAst,
        importSources,
      } = stage1Result;

      // replace `compose` calls to temporal strings
      const { uuidToStylesMap, ast: stage2ReplacedAst } =
        await prepareCompositions({
          stage1Result: {
            ast: stage1CapturedAst,
            importSources,
            variableNames: [...capturedVariableNames.values()],
          },
          projectRoot: config.root,
          filename: path,
          isDev,
          resolve: async (importSource) => {
            const resolved = await this.resolve(importSource, path);
            return resolved?.id;
          },
        });

      const evaluateModule = createEvaluator({
        server,
        transformContext: this,
        modulePath: path,
      });

      const { mapOfClassNamesToStyles, evaluatedGlobalStyles } =
        await evaluateModule({
          ast: stage2ReplacedAst,
          capturedVariableNames,
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
        originalInfo: isDev
          ? {
              ast: parsed,
              filename: path,
              jsPositions: capturedVariableNames,
            }
          : null,
      });

      const { transformed: resultCode, map } =
        await assignStylesToCapturedVariables({
          css: {
            modules: {
              importId: cssModule.importId,
              originalToTemporalMap: capturedVariableNames,
            },
            globals: {
              importId: globalStyle.importId,
              temporalVariableNames: capturedGlobalStylesTempNames,
            },
          },
          stage2Result: { ast: stage2ReplacedAst },
          isDev,
          filename: path,
          root: config.root,
        });

      registerCssModule({
        classNameToStyle: new Map(
          composedStyles.map(({ style, originalName }) => [
            originalName,
            { style, className: originalName },
          ]),
        ),
        map: cssModule.map,
        path,
        style: cssModule.style,
        virtualId: cssModule.importId,
      });
      registerGlobalStyle({
        path,
        style: globalStyle.style,
        virtualId: globalStyle.importId,
      });

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
            ast: stage1CapturedAst,
          },
          "2": {
            ast: stage2ReplacedAst,
            uuidToStylesMap,
          },
          "3": {
            mapOfClassNamesToStyles,
            evaluatedGlobalStyles,
          },
          "4": {
            composedStyles,
          },
          "5": {
            cssModule: {
              importId: cssModule.importId,
              map: cssModule.map ?? "",
              style: cssModule.style,
            },
            globalStyle,
          },
          "6": { transformed: resultCode, map },
        },
        transformed: resultCode,
      });

      return {
        code: resultCode,
        map,
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
