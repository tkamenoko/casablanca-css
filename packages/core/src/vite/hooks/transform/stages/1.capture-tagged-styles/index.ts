import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import { plugin } from "./plugin";
import type {
  CapturedVariableNames,
  GlobalStylePositions,
  ImportSource,
  Options,
} from "./types";

type CaptureTaggedStylesArgs = {
  ast: types.File;
  filename: string;
  isDev: boolean;
};

export type CaptureTaggedStylesReturn = {
  ast: types.File;
  capturedVariableNames: CapturedVariableNames;
  capturedGlobalStylesTempNames: string[];
  globalStylePositions: GlobalStylePositions;
  importSources: ImportSource[];
};

// find tagged templates, then remove all tags.
// enforce variables to export.
export async function captureTaggedStyles({
  ast,
  isDev,
  filename,
}: CaptureTaggedStylesArgs): Promise<CaptureTaggedStylesReturn | null> {
  const pluginOption: Options = {
    capturedVariableNames: new Map(),
    capturedGlobalStylesTempNames: [],
    globalStylePositions: [],
    importSources: [],
  };
  const result = await transformFromAstAsync(ast, undefined, {
    plugins: [[plugin, pluginOption]],
    sourceMaps: isDev ? "both" : false,
    ast: true,
    code: false,
    filename,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { ast: capturedAst } = result;
  if (!capturedAst) {
    throw new Error("Failed");
  }

  if (
    !(
      pluginOption.capturedVariableNames.size ||
      pluginOption.capturedGlobalStylesTempNames.length
    )
  ) {
    return null;
  }

  return {
    capturedVariableNames: pluginOption.capturedVariableNames,
    capturedGlobalStylesTempNames: pluginOption.capturedGlobalStylesTempNames,
    ast: capturedAst,
    globalStylePositions: pluginOption.globalStylePositions,
    importSources: pluginOption.importSources,
  };
}
