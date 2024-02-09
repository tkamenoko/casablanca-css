import { transformFromAstAsync, type types } from "@babel/core";
import { createClassNamesPlugin } from "./createClassNames";

type CreateClassNamesFromComponentsArgs = {
  ast: types.File;
  code: string;
  isDev: boolean;
};
export type CreateClassNamesFromComponentsReturn = {
  ast: types.File;
  code: string;
};

export async function createClassNamesFromComponents({
  ast,
  code,
  isDev,
}: CreateClassNamesFromComponentsArgs): Promise<CreateClassNamesFromComponentsReturn> {
  const result = await transformFromAstAsync(ast, code, {
    plugins: [[createClassNamesPlugin, {}]],
    sourceMaps: isDev ? "inline" : false,
    ast: true,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { code: transformedCode, ast: transformedAst } = result;
  if (!(transformedCode && transformedAst)) {
    throw new Error("Failed");
  }
  return { ast: transformedAst, code: transformedCode };
}
