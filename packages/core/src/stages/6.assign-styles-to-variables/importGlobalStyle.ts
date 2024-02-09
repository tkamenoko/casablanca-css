import type { PluginObj, PluginPass } from "@babel/core";
import type babel from "@babel/core";
import { isTopLevelStatement } from "@macrostyles/utils";
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

      VariableDeclaration: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }

          const { temporalVariableNames } = state.opts.globalStyle;
          if (!temporalVariableNames.length) {
            return;
          }
          for (const declaration of path.get("declarations")) {
            const id = declaration.get("id");
            if (!id.isIdentifier()) {
              continue;
            }
            const name = id.node.name;
            if (!temporalVariableNames.includes(name)) {
              return;
            }
            declaration.remove();
          }
        },
      },
    },
  };
}
