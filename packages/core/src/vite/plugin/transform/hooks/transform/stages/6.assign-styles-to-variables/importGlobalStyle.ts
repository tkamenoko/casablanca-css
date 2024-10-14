import type { PluginObj, PluginPass } from "@babel/core";
import type babel from "@babel/core";
import { isTopLevelStatement } from "@casablanca-css/utils";
import type { Options } from "./types";

type BabelState = {
  opts: Options;
};

export function importGlobalStylePlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      Program: {
        enter: (path, state) => {
          const head = path.get("body").at(0);
          if (!head) {
            return;
          }
          const { globalStyle } = state.opts;
          if (globalStyle.temporalVariableNames.length) {
            head.insertBefore(
              t.importDeclaration([], t.stringLiteral(globalStyle.importId)),
            );
          }
        },
      },
      VariableDeclarator: {
        enter: (path, state) => {
          const declaration = path.parentPath;
          if (
            !(declaration.isDeclaration() && isTopLevelStatement(declaration))
          ) {
            return;
          }
          const { temporalVariableNames } = state.opts.globalStyle;
          const id = path.get("id");
          if (!id.isIdentifier()) {
            return;
          }
          const name = id.node.name;
          if (!temporalVariableNames.includes(name)) {
            return;
          }
          path.remove();
        },
      },
    },
  };
}
