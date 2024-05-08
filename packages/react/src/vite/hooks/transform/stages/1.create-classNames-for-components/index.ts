import { transformFromAstAsync, type types } from "@babel/core";
import { plugin } from "./plugin";

type CreateClassNamesFromComponentsArgs = {
  ast: types.File;
  originalCode: string;
  isDev: boolean;
};
export type CreateClassNamesFromComponentsReturn = {
  ast: types.File;
};

export async function createClassNamesFromComponents({
  ast,
  isDev,
  originalCode,
}: CreateClassNamesFromComponentsArgs): Promise<CreateClassNamesFromComponentsReturn> {
  const result = await transformFromAstAsync(ast, originalCode, {
    plugins: [[plugin, {}]],
    sourceMaps: isDev ? "inline" : false,
    ast: true,
    code: false,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { ast: transformedAst } = result;
  if (!transformedAst) {
    throw new Error("Failed");
  }

  return { ast: transformedAst };
}
