import type { types } from "@babel/core";
import { transformFromAstAsync } from "@babel/core";
import { plugin } from "./plugin";

type ModifyEmbeddedComponentsArgs = {
  ast: types.File;
  isDev: boolean;
};

export type ModifyEmbeddedComponentsReturn = {
  code: string;
  map: string | null;
};

export async function modifyEmbeddedComponents({
  ast,
  isDev,
}: ModifyEmbeddedComponentsArgs): Promise<ModifyEmbeddedComponentsReturn> {
  const result = await transformFromAstAsync(ast, undefined, {
    plugins: [[plugin, {}]],
    sourceMaps: isDev,
  });
  if (!result) {
    throw new Error("Failed");
  }
  const { code: transformed, map } = result;
  if (!transformed) {
    throw new Error("Failed");
  }
  if (!isDev) {
    return { code: transformed, map: null };
  }
  if (!map) {
    throw new Error("Failed");
  }

  return { code: transformed, map: JSON.stringify(map) };
}
