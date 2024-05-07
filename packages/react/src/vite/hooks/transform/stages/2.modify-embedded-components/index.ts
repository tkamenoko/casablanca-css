import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import { plugin } from "./plugin";

type ModifyEmbeddedComponentsArgs = {
  ast: types.File;
  isDev: boolean;
};

export type ModifyEmbeddedComponentsReturn = { code: string };

export async function modifyEmbeddedComponents({
  ast,
  isDev,
}: ModifyEmbeddedComponentsArgs): Promise<ModifyEmbeddedComponentsReturn> {
  const result = await transformFromAstAsync(ast, undefined, {
    plugins: [[plugin, {}]],
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
