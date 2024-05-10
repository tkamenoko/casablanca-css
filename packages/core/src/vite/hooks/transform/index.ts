import type { ParseResult } from "@babel/core";
import type { Rollup, ViteDevServer } from "vite";
import type { CssModulesLookup } from "#@/vite/types";
import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { VirtualGlobalStyleId } from "#@/vite/virtualGlobalStyleId";
import { captureTaggedStyles } from "./stages/1.capture-tagged-styles";
import { prepareCompositions } from "./stages/2.prepare-compositions";
import { createEvaluator } from "./stages/3.evaluate-module";
import type { EvaluateOptions } from "./stages/3.evaluate-module/types";
import { replaceUuidWithStyles } from "./stages/4.assign-composed-styles-to-uuid";
import { createVirtualModules } from "./stages/5.create-virtual-modules";
import { assignStylesToCapturedVariables } from "./stages/6.assign-styles-to-variables";
import type { StageResults } from "./types";

type TransformArgs = {
  path: string;
  ctx: Rollup.TransformPluginContext;
  originalCode: string;
  originalAst: ParseResult;
  isDev: boolean;
  projectRoot: string;
  server: ViteDevServer | null;
  cssModulesLookup: CssModulesLookup;
  evaluateOptions: Partial<EvaluateOptions>;
};

type TransformReturn = {
  cssModule: {
    style: string;
    importId: VirtualCssModuleId;
    map: string;
    composedStyles: {
      temporalVariableName: string;
      originalName: string;
      style: string;
    }[];
  };
  globalStyle: { style: string; importId: VirtualGlobalStyleId; map: string };
  js: { code: string; map: string | null };
  stageResults: StageResults;
} | null;

export async function transform({
  ctx,
  path,
  originalAst,
  originalCode,
  isDev,
  projectRoot,
  server,
  cssModulesLookup,
  evaluateOptions,
}: TransformArgs): Promise<TransformReturn> {
  // find tagged templates, then remove all tags.
  const stage1Result = await captureTaggedStyles({
    ast: originalAst,
    isDev,
    filename: path,
  });

  if (!stage1Result) {
    return null;
  }

  const {
    capturedVariableNames,
    capturedGlobalStylesTempNames,
    ast: stage1CapturedAst,
    importSources,
    globalStylePositions,
  } = stage1Result;

  // replace `compose` calls with temporal strings
  const { uuidToStylesMap, ast: stage2ReplacedAst } = await prepareCompositions(
    {
      stage1Result: {
        ast: stage1CapturedAst,
        importSources,
        variableNames: [...capturedVariableNames.values()],
      },
      projectRoot,
      filename: path,
      isDev,
      resolve: async (importSource) => {
        const resolved = await ctx.resolve(importSource, path);
        return resolved?.id;
      },
    },
  );

  const evaluateModule = createEvaluator({
    server,
    transformContext: ctx,
    modulePath: path,
    evaluateOptions,
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
    projectRoot,
    originalInfo: isDev
      ? {
          content: originalCode,
          filename: path,
          jsClassNamePositions: capturedVariableNames,
          jsGlobalStylePositions: globalStylePositions,
          previousSourceMap: ctx.getCombinedSourcemap(),
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
    });

  return {
    cssModule: {
      importId: cssModule.importId,
      style: cssModule.style,
      map: "map" in cssModule ? cssModule.map : "",
      composedStyles,
    },
    globalStyle: {
      importId: globalStyle.importId,
      style: globalStyle.style,
      map: "map" in globalStyle ? globalStyle.map : "",
    },
    js: { code: resultCode, map },
    stageResults: {
      "1": {
        ast: stage1CapturedAst,
        capturedGlobalStylesTempNames,
        capturedVariableNames,
        globalStylePositions,
        importSources,
      },
      "2": { ast: stage2ReplacedAst, uuidToStylesMap },
      "3": { evaluatedGlobalStyles, mapOfClassNamesToStyles },
      "4": { composedStyles },
      "5": { cssModule, globalStyle },
      "6": { map, transformed: resultCode },
    },
  };
}
