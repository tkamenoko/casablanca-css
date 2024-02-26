import type { PluginObj, PluginPass } from "@babel/core";
import type babel from "@babel/core";
import { isTopLevelStatement } from "@casablanca/utils";
import { removeTemporalVariable } from "./removeTemporalVariable";
import { replaceOriginalVariable } from "./replaceOriginalVariable";
import type { Options } from "./types";

type BabelState = {
  opts: Options;
  importIdName?: string;
};

export function assignStylesPlugin({
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
          const { cssModule } = state.opts;
          if (cssModule.temporalVariableNames.size) {
            const stylesId = path.scope.generateUidIdentifier("styles");
            state.importIdName = stylesId.name;
            head.insertBefore(
              t.importDeclaration(
                [t.importDefaultSpecifier(stylesId)],
                t.stringLiteral(cssModule.importId),
              ),
            );
          }
        },
      },

      VariableDeclaration: {
        enter: (path, state) => {
          if (!isTopLevelStatement(path)) {
            return;
          }
          if (!state.importIdName) {
            return;
          }
          const { temporalVariableNames, originalToTemporalMap } =
            state.opts.cssModule;
          const stylesId = t.identifier(state.importIdName);
          for (const declaration of path.get("declarations")) {
            const id = declaration.get("id");
            if (!id.isIdentifier()) {
              continue;
            }
            const name = id.node.name;
            removeTemporalVariable({ name, path, temporalVariableNames });
            replaceOriginalVariable({
              declaration,
              name,
              originalToTemporalMap,
              stylesId,
            });
          }
        },
      },
    },
  };
}
