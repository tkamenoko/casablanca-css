import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import type { Rollup } from "vite";
import type { VirtualGlobalStyleId } from "#@/vite/types";
import type { VirtualCssModuleId } from "#@/vite/virtualCssModuleId";
import type { CapturedVariableNames } from "../1.capture-tagged-styles/types";
import { assignStylesPlugin } from "./assignStyles";
import { importGlobalStylePlugin } from "./importGlobalStyle";
import type { Options } from "./types";

type AssignStylesToCapturedVariablesArgs = {
  stage2Result: {
    ast: types.File;
  };
  css: {
    modules: {
      originalToTemporalMap: CapturedVariableNames;
      importId: VirtualCssModuleId;
    };
    globals: {
      temporalVariableNames: string[];
      importId: VirtualGlobalStyleId;
    };
  };
  filename: string;
  root: string;
  isDev: boolean;
};
export type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
  map: Rollup.ExistingRawSourceMap | null;
};

export async function assignStylesToCapturedVariables({
  css,
  stage2Result,
  filename,
  isDev,
  root,
}: AssignStylesToCapturedVariablesArgs): Promise<AssignStylesToCapturedVariablesReturn> {
  const pluginOption: Options = {
    cssModule: {
      ...css.modules,
      temporalVariableNames: new Set(
        [...css.modules.originalToTemporalMap.values()].map(
          (v) => v.temporalName,
        ),
      ),
    },
    globalStyle: css.globals,
  };
  const result = await transformFromAstAsync(stage2Result.ast, undefined, {
    plugins: [
      [assignStylesPlugin, pluginOption],
      [importGlobalStylePlugin, pluginOption],
    ],
    sourceMaps: isDev,
    filename,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { code: transformed, map } = result;
  if (!transformed) {
    throw new Error("Failed");
  }

  if (!isDev) {
    return { transformed, map: null };
  }
  if (!map) {
    throw new Error("Failed");
  }

  const { code: previousCode } =
    (await transformFromAstAsync(stage2Result.ast)) ?? {};
  if (!previousCode) {
    throw new Error("Failed");
  }

  return {
    transformed,
    map: { ...map, sourceRoot: root, sourcesContent: [previousCode] },
  };
}
