import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import type { VirtualCssModuleId, VirtualGlobalStyleId } from "#@/vite/types";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";
import { assignStylesPlugin } from "./assignStyles";
import { importGlobalStylePlugin } from "./importGlobalStyle";
import type { Options } from "./types";

type AssignStylesToCapturedVariablesArgs = {
  stage2Result: {
    ast: types.File;
  };
  css: {
    modules: {
      temporalVariableNames: CapturedVariableNames;
      originalToTemporalMap: CapturedVariableNames;
      importId: VirtualCssModuleId;
    };
    globals: {
      temporalVariableNames: string[];
      importId: VirtualGlobalStyleId;
    };
  };

  isDev: boolean;
};
export type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

export async function assignStylesToCapturedVariables({
  css,
  stage2Result,
  isDev,
}: AssignStylesToCapturedVariablesArgs): Promise<AssignStylesToCapturedVariablesReturn> {
  const pluginOption: Options = {
    cssModule: css.modules,
    globalStyle: css.globals,
  };
  const result = await transformFromAstAsync(stage2Result.ast, undefined, {
    plugins: [
      [assignStylesPlugin, pluginOption],
      [importGlobalStylePlugin, pluginOption],
    ],
    sourceMaps: isDev ? "inline" : false,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error("Failed");
  }

  return { transformed };
}
