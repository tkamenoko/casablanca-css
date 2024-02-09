import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import type { VirtualCssModuleId, VirtualGlobalStyleId } from "#@/vite/types";
import type { CapturedVariableNames } from "../1.capture-tagged-styles";
import { assignStylesPlugin } from "./assignStyles";
import { importGlobalStylePlugin } from "./importGlobalStyle";
import type { Options } from "./types";

type AssignStylesToCapturedVariablesArgs = {
  replaced: types.File;
  originalCode: string;
  cssModule: {
    temporalVariableNames: CapturedVariableNames;
    originalToTemporalMap: CapturedVariableNames;
    importId: VirtualCssModuleId;
  };
  globalStyle: {
    temporalVariableNames: string[];
    importId: VirtualGlobalStyleId;
  };
  isDev: boolean;
};
export type AssignStylesToCapturedVariablesReturn = {
  transformed: string;
};

export async function assignStylesToCapturedVariables({
  replaced,
  originalCode,
  cssModule,
  globalStyle,
  isDev,
}: AssignStylesToCapturedVariablesArgs): Promise<AssignStylesToCapturedVariablesReturn> {
  const pluginOption: Options = {
    cssModule,
    globalStyle,
  };
  const result = await transformFromAstAsync(replaced, originalCode, {
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
