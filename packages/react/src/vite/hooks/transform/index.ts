import type { ParseResult } from "@babel/core";
import type { StageResults } from "#@/vite/types";
import { createClassNamesFromComponents } from "./stages/1.create-classNames-for-components";
import { modifyEmbeddedComponents } from "./stages/2.modify-embedded-components";

type TransformArgs = {
  originalAst: ParseResult;
  originalCode: string;
  isDev: boolean;
};
type TransformReturn = {
  code: string;
  map: string | null;
  stageResults: StageResults;
};

export async function transform({
  isDev,
  originalCode,
  originalAst,
}: TransformArgs): Promise<TransformReturn> {
  const { ast: astWithClassNames } = await createClassNamesFromComponents({
    ast: originalAst,
    originalCode,
    isDev,
  });

  const { code, map } = await modifyEmbeddedComponents({
    ast: astWithClassNames,
    isDev,
  });

  return {
    code,
    map,
    stageResults: { "1": { ast: astWithClassNames }, "2": { code, map } },
  };
}
