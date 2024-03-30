import type babel from "@babel/core";
import type { PluginObj, PluginPass } from "@babel/core";
import { isTopLevelStatement } from "@casablanca/utils";
import { buildComposeInternalExpression } from "./buildComposeInternalExpression";
import { collectComposeArgsValues } from "./collectComposeArgsValues";
import { extractPathsFromQuasi } from "./extractPathsFromQuasi";
import { extractTemplatePathFromDeclarator } from "./extractTemplatePathFromDeclarator";
import { markImportedSelectorsAsGlobal } from "./markImportedSelectorsAsGlobal";
import type { EmbeddedToClassNameMap, UuidToStylesMap } from "./types";

export type Options = {
  temporalVariableNames: string[];
  embeddedToClassNameMap: EmbeddedToClassNameMap;
  uuidToStylesMap: UuidToStylesMap;
};

type BabelState = {
  opts: Options;
};

export function replaceEmbeddedValuesPlugin({
  types: t,
}: typeof babel): PluginObj<PluginPass & BabelState> {
  return {
    visitor: {
      VariableDeclarator: {
        enter: (path, state) => {
          const declaration = path.parentPath;
          if (!isTopLevelStatement(declaration)) {
            return;
          }
          const validatedDeclaration = extractTemplatePathFromDeclarator({
            declarator: path,
            temporalVariableNames: state.opts.temporalVariableNames,
          });
          if (!validatedDeclaration) {
            return;
          }
          const { init } = validatedDeclaration;
          // raw classNames are replaced with unique classNames even if it is already modified.
          // imported classNames are already evaluated. This avoids duplication of replacing classNames.
          markImportedSelectorsAsGlobal({ templateLiteralPath: init });
          // fix `composes: ...` property
          const expressions = init.get("expressions");
          const quasis = init.get("quasis");
          for (const [i, quasi] of quasis.entries()) {
            const validatedQuasi = extractPathsFromQuasi({
              expressions,
              index: i,
              quasi,
            });
            if (!validatedQuasi) {
              continue;
            }
            const { expression, ids, style } = validatedQuasi;

            const { uuidToStylesMap, embeddedToClassNameMap } = state.opts;
            const composeArgs = collectComposeArgsValues({
              embeddedToClassNameMap,
              ids,
              uuidToStylesMap,
            });

            const composeInternal = buildComposeInternalExpression({
              composeArgs,
            });
            expression.replaceWith(composeInternal);
            const removedCompose = style.replace(
              /(?<prev>;|\s)composes:\s*$/,
              "$<prev>",
            );
            quasi.replaceWith(t.templateElement({ raw: removedCompose }));
          }
        },
      },
    },
  };
}
