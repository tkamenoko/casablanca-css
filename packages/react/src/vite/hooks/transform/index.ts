import type { ParseResult } from "@babel/core";
import { createClassNamesFromComponents } from "#@/stages/1.create-classNames-for-components";
import { modifyEmbeddedComponents } from "#@/stages/2.modify-embedded-components";
import type { StageResults } from "#@/vite/types";

type TransformArgs = { originalAst: ParseResult; isDev: boolean };
type TransformReturn = {
  code: string;
  stageResults: StageResults;
};

export async function transform({
  isDev,
  originalAst,
}: TransformArgs): Promise<TransformReturn> {
  const { ast: astWithClassNames } = await createClassNamesFromComponents({
    ast: originalAst,
    isDev,
  });

  const { code } = await modifyEmbeddedComponents({
    ast: astWithClassNames,
    isDev,
  });

  return {
    code,
    stageResults: { "1": { ast: astWithClassNames }, "2": { code } },
  };
}
