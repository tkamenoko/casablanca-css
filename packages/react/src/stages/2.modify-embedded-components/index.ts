import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import { modifyCompositionsPlugin } from "./modifyComposition";

type ModifyEmbeddedComponentsArgs = {
  ast: types.File;
  code: string;
  isDev: boolean;
};

export type ModifyEmbeddedComponentsReturn = { code: string };

export async function modifyEmbeddedComponents({
  ast,
  code,
  isDev,
}: ModifyEmbeddedComponentsArgs): Promise<ModifyEmbeddedComponentsReturn> {
  const result = await transformFromAstAsync(ast, code, {
    plugins: [[modifyCompositionsPlugin, {}]],
    sourceMaps: isDev ? "inline" : false,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { code: transformed } = result;
  if (!transformed) {
    throw new Error("Failed");
  }
  return { code: transformed };
}
