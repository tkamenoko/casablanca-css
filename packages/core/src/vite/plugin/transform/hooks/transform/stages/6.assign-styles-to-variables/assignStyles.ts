import type babel from "@babel/core";
import type { PluginObj, PluginPass } from "@babel/core";
import { isTopLevelStatement } from "@casablanca-css/utils";
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
      VariableDeclarator: {
        enter: (path, state) => {
          const declaration = path.parentPath;
          if (
            !(
              declaration.isVariableDeclaration() &&
              isTopLevelStatement(declaration)
            )
          ) {
            return;
          }
          if (!state.importIdName) {
            return;
          }
          const { temporalVariableNames, originalToTemporalMap } =
            state.opts.cssModule;
          const stylesId = t.identifier(state.importIdName);
          const id = path.get("id");
          if (!id.isIdentifier()) {
            return;
          }
          const name = id.node.name;
          removeTemporalVariable({
            name,
            declaration,
            temporalVariableNames,
          });
          replaceOriginalVariable({
            declarator: path,
            name,
            originalToTemporalMap,
            stylesId,
          });
        },
      },
    },
  };
}
