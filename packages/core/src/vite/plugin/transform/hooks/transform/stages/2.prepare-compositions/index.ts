import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import type { ImportSource } from "../1.capture-tagged-styles/types";
import { buildEmbeddedToClassNameMap } from "./buildEmbeddedToClassNameMap";
import { type Options, plugin } from "./plugin";
import type { UuidToStylesMap } from "./types";

type PrepareCompositionsArgs = {
  stage1Result: {
    ast: types.File;
    variableNames: { originalName: string; temporalName: string }[];
    importSources: ImportSource[];
  };
  isDev: boolean;
  projectRoot: string;
  filename: string;
  resolve: (id: string) => Promise<string | null | undefined>;
};

export type PrepareCompositionsReturn = {
  ast: types.File;
  uuidToStylesMap: UuidToStylesMap;
};

export async function prepareCompositions({
  stage1Result,
  projectRoot,
  filename,
  resolve,
  isDev,
}: PrepareCompositionsArgs): Promise<PrepareCompositionsReturn> {
  const embeddedToClassNameMap = await buildEmbeddedToClassNameMap({
    importSources: stage1Result.importSources,
    projectRoot,
    resolve,
  });

  // replace `composes: ...;` expressions with `compose` calls.
  const uuidToStylesMap: UuidToStylesMap = new Map();
  const pluginOption: Options = {
    temporalVariableNames: stage1Result.variableNames.map(
      (v) => v.temporalName,
    ),
    embeddedToClassNameMap,
    uuidToStylesMap,
  };
  const result = await transformFromAstAsync(stage1Result.ast, undefined, {
    plugins: [[plugin, pluginOption]],
    sourceMaps: isDev ? "inline" : false,
    ast: true,
    code: false,
    filename,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { ast } = result;
  if (!ast) {
    throw new Error("Failed");
  }

  return { uuidToStylesMap, ast };
}
