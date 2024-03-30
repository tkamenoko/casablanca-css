import { randomUUID } from "node:crypto";
import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import { buildResolvedIdFromJsId } from "#@/vite/helpers/buildResolvedIdFromJsId";
import type { ResolvedCssModuleId } from "#@/vite/types";
import type { ImportSource } from "../1.capture-tagged-styles/types";
import {
  type Options,
  replaceEmbeddedValuesPlugin,
} from "./replaceEmbeddedValues";
import type { UuidToStylesMap } from "./types";

type PrepareCompositionsArgs = {
  stage1Result: {
    ast: types.File;
    variableNames: { originalName: string; temporalName: string }[];
    importSources: ImportSource[];
  };
  isDev: boolean;
  projectRoot: string;
  resolve: (id: string) => Promise<string | null>;
};

export type PrepareCompositionsReturn = {
  ast: types.File;
  uuidToStylesMap: UuidToStylesMap;
};

export async function prepareCompositions({
  stage1Result,
  projectRoot,
  resolve,
  isDev,
}: PrepareCompositionsArgs): Promise<PrepareCompositionsReturn> {
  // create embeddedName-to-className+resolvedId map
  const embeddedToClassNameMap = new Map<
    string,
    { className: string; cssId: ResolvedCssModuleId; uuid: string }
  >();
  await Promise.all(
    stage1Result.importSources.map(async ({ names, source }) => {
      const resolvedId = await resolve(source);
      if (!resolvedId) {
        return;
      }

      const cssId = buildResolvedIdFromJsId({ jsId: resolvedId, projectRoot });
      for (const { className, localName } of names) {
        embeddedToClassNameMap.set(localName, {
          className,
          cssId,
          uuid: randomUUID(),
        });
      }
    }),
  );

  // replace `compose` calls with `composes: ...;` expressions.
  const uuidToStylesMap: UuidToStylesMap = new Map();
  const pluginOption: Options = {
    temporalVariableNames: stage1Result.variableNames.map(
      (v) => v.temporalName,
    ),
    embeddedToClassNameMap,
    uuidToStylesMap,
  };
  const result = await transformFromAstAsync(stage1Result.ast, undefined, {
    plugins: [[replaceEmbeddedValuesPlugin, pluginOption]],
    sourceMaps: isDev ? "inline" : false,
    ast: true,
    code: false,
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
