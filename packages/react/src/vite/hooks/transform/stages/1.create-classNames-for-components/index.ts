import { transformFromAstAsync, type types } from "@babel/core";
import { createClassNamesPlugin } from "./createClassNames";

type CreateClassNamesFromComponentsArgs = {
  ast: types.File;
  isDev: boolean;
};
export type CreateClassNamesFromComponentsReturn = {
  ast: types.File;
};

export async function createClassNamesFromComponents({
  ast,
  isDev,
}: CreateClassNamesFromComponentsArgs): Promise<CreateClassNamesFromComponentsReturn> {
  const result = await transformFromAstAsync(ast, undefined, {
    plugins: [[createClassNamesPlugin, {}]],
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
